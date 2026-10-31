import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  CreditCard, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Zap,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';

interface InvoicesViewProps {
  onSelectInvoice: (invoiceId: string) => void;
  onOpenPayment: (invoice: any) => void;
  onOpenBillingModal: () => void;
  userRole?: string;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onSelectInvoice,
  onOpenPayment,
  onOpenBillingModal,
  userRole
}) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const list = await api.getInvoices();
      setInvoices(list);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = invoices.filter(inv => {
    if (filter === 'unpaid') {
      if (!['issued', 'overdue', 'partially_paid'].includes(inv.status)) return false;
    } else if (filter !== 'all' && inv.status !== filter) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchNum = inv.invoice_number.toLowerCase().includes(q);
      const matchCust = inv.customer_name?.toLowerCase().includes(q);
      return matchNum || matchCust;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Invoices & Billing Statements</h2>
          <p className="text-xs text-slate-500">Track issued, paid, partially settled, and overdue invoices</p>
        </div>

        {userRole !== 'customer' && (
          <button
            onClick={onOpenBillingModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Run Billing Engine
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'unpaid', label: 'Unpaid / Outstanding' },
            { id: 'paid', label: 'Paid' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'void', label: 'Void' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#944a27]/20 focus:border-[#944a27]"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Invoices Found</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              {search || filter !== 'all'
                ? 'No invoices match your current filter and search criteria.'
                : 'There are no billing invoices generated yet. Run the recurring billing engine or confirm a quotation to generate invoices.'}
            </p>
            {userRole !== 'customer' && !search && filter === 'all' && (
              <button
                onClick={onOpenBillingModal}
                className="px-3.5 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Run Billing Cycle</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status & Aging</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => {
                  const isOverdue = inv.status === 'overdue' || (inv.balance_due > 0 && inv.due_date < today);
                  let daysOverdue = 0;
                  if (isOverdue) {
                    const diffMs = new Date(today).getTime() - new Date(inv.due_date).getTime();
                    daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <button
                          onClick={() => onSelectInvoice(inv.id)}
                          className="text-[#944a27] hover:text-[#833f20] font-semibold hover:underline"
                        >
                          {inv.invoice_number}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{inv.customer_name}</span>
                        {inv.subscription_number && (
                          <span className="text-[10px] text-slate-400 font-mono">Sub: {inv.subscription_number}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{inv.issue_date}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {inv.due_date}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-right font-bold text-slate-900">
                        ${inv.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-emerald-600 font-medium">
                        ${inv.paid_amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right font-bold">
                        <span className={inv.balance_due > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          ${inv.balance_due.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            inv.status === 'partially_paid' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                            isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            inv.status === 'void' ? 'bg-slate-200 text-slate-600' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {inv.status}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-0.5">
                              ⚠️ {daysOverdue}d overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balance_due > 0 && inv.status !== 'void' && (
                            <button
                              onClick={() => onOpenPayment(inv)}
                              className="px-2.5 py-1 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-all"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => onSelectInvoice(inv.id)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
