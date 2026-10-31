import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Copy,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';

interface QuotationsViewProps {
  onOpenNewQuotation: () => void;
  userRole?: string;
  onRefreshSubscriptions?: () => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  onOpenNewQuotation,
  userRole,
  onRefreshSubscriptions
}) => {
  const [activeTab, setActiveTab] = useState<'quotations' | 'templates'>('quotations');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, tList] = await Promise.all([
        api.getQuotations(),
        api.getTemplates(),
      ]);
      setQuotations(qList);
      setTemplates(tList);
    } catch (err: any) {
      console.error('Error loading quotations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateQuotationStatus(id, status);
      loadData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm('Convert this accepted quotation into an active recurring subscription?')) return;
    try {
      await api.convertQuotation(id);
      alert('Quotation successfully converted to an Active Subscription!');
      loadData();
      if (onRefreshSubscriptions) onRefreshSubscriptions();
    } catch (err: any) {
      alert(`Conversion error: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this quotation template?')) return;
    try {
      await api.deleteTemplate(id);
      loadData();
    } catch (err: any) {
      alert(`Error deleting template: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quotations & Pricing Templates</h2>
          <p className="text-xs text-slate-500">Draft proposals, customize seat discounts, and convert to active subscriptions</p>
        </div>

        {userRole !== 'customer' && (
          <button
            onClick={onOpenNewQuotation}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'quotations'
              ? 'border-[#944a27] text-[#944a27]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Issued Quotations ({quotations.length})
        </button>

        {userRole !== 'customer' && (
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'border-[#944a27] text-[#944a27]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Pre-configured Quotation Templates ({templates.length})
          </button>
        )}
      </div>

      {/* Quotations List Tab */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileCheck2 className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No Quotations Created</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                Prepare customized subscription quotes with products, discounts, and taxes for your customers.
              </p>
              {userRole !== 'customer' && (
                <button
                  onClick={onOpenNewQuotation}
                  className="px-3.5 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  + Create New Quotation
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Quotation #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Tax</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {q.quotation_number}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{q.customer_name}</span>
                        <span className="text-[10px] text-slate-400">{q.customer_company || q.customer_email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">${q.subtotal.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600">
                        {q.discount_amount > 0 ? `-$${q.discount_amount.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">${q.tax_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        ${q.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{q.valid_until}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          q.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          q.status === 'converted' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          q.status === 'sent' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                          q.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send to client */}
                          {q.status === 'draft' && userRole !== 'customer' && (
                            <button
                              onClick={() => handleStatusChange(q.id, 'sent')}
                              className="px-2.5 py-1 text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Send
                            </button>
                          )}

                          {/* Accept / Reject (both client and staff can execute) */}
                          {['draft', 'sent'].includes(q.status) && (
                            <>
                              <button
                                onClick={() => handleStatusChange(q.id, 'accepted')}
                                className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(q.id, 'rejected')}
                                className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Convert to Subscription */}
                          {q.status === 'accepted' && userRole !== 'customer' && (
                            <button
                              onClick={() => handleConvert(q.id)}
                              className="px-3 py-1 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-all"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Convert to Sub
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quotation Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-slate-900">{tmpl.name}</h4>
                  <span className="text-[10px] font-bold text-[#944a27] bg-[#944a27]/10 border border-[#944a27]/20 px-2 py-0.5 rounded-full">
                    Template
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{tmpl.description}</p>

                <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-semibold text-slate-800">{tmpl.plan_name} (${tmpl.plan_price}/{tmpl.billing_interval})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Default Quantity:</span>
                    <span className="font-mono font-medium text-slate-800">{tmpl.default_quantity} seats</span>
                  </div>
                  {tmpl.discount_code && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pre-set Discount:</span>
                      <span className="font-mono text-emerald-600 font-semibold">{tmpl.discount_code} ({tmpl.discount_name})</span>
                    </div>
                  )}
                  {tmpl.terms && (
                    <div className="pt-1 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-600">Terms: </span>{tmpl.terms}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDeleteTemplate(tmpl.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenNewQuotation}
                  className="px-3 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Use this Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
