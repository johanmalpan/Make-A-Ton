import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Repeat, 
  Receipt, 
  CreditCard, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';

interface CustomerPortalViewProps {
  customer: any;
  user: any;
  onSelectInvoice: (invoiceId: string) => void;
  onOpenPayment: (invoice: any) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  customer,
  user,
  onSelectInvoice,
  onOpenPayment
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPortalData = async () => {
    if (!user?.customer_id) return;
    try {
      setLoading(true);
      const res = await api.getCustomer(user.customer_id);
      const quotes = await api.getQuotations();
      setData({ ...res, quotations: quotes });
    } catch (err: any) {
      console.error('Error loading customer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user?.customer_id]);

  const handleQuotationStatus = async (quoteId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.updateQuotationStatus(quoteId, status);
      alert(`Quotation ${status === 'accepted' ? 'Accepted! Brightloop team will activate your subscription.' : 'Declined.'}`);
      loadPortalData();
    } catch (err: any) {
      alert(`Error updating quotation: ${err.message}`);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-medium">
        Loading your client portal account...
      </div>
    );
  }

  const { subscriptions, invoices, payments, quotations } = data;
  const pendingInvoices = invoices.filter((i: any) => ['issued', 'overdue', 'partially_paid'].includes(i.status));
  const pendingQuotes = quotations.filter((q: any) => ['sent', 'draft'].includes(q.status));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Client Portal
            </span>
            <span className="text-xs text-slate-400">Brightloop Software Subscriber</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{data.customer.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            {data.customer.company || 'Enterprise Account'} • {data.customer.email} • {data.customer.tax_id ? `Tax ID: ${data.customer.tax_id}` : ''}
          </p>
        </div>

        {/* Quick Outstanding Notice */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-right min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Outstanding Balance</span>
          <span className={`text-2xl font-black font-mono ${
            pendingInvoices.length > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            ${pendingInvoices.reduce((acc: number, i: any) => acc + i.balance_due, 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {pendingInvoices.length} pending bill{pendingInvoices.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Pending Invoices / Pay Now Section */}
      {pendingInvoices.length > 0 && (
        <div className="p-6 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-950">Invoices Awaiting Payment</h3>
                <p className="text-xs text-rose-700">Settle your subscription invoices via instant gateway or card</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvoices.map((inv: any) => (
              <div key={inv.id} className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">{inv.invoice_number}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      inv.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Due: <strong className="text-slate-800">{inv.due_date}</strong></p>
                  <p className="text-xs font-mono font-bold text-rose-600 mt-1">
                    Balance Due: ${inv.balance_due.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectInvoice(inv.id)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg transition-all"
                  >
                    View Bill
                  </button>
                  <button
                    onClick={() => onOpenPayment(inv)}
                    className="px-3.5 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Quotations to Accept / Reject */}
      {pendingQuotes.length > 0 && (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#944a27]" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quotations Prepared for You</h3>
                <p className="text-xs text-slate-500">Review subscription proposals and accept to begin service</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingQuotes.map((q: any) => (
              <div key={q.id} className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-slate-900 text-xs">{q.quotation_number}</span>
                  <p className="text-[11px] text-slate-500 mt-1">Valid Until: {q.valid_until}</p>
                  <p className="text-sm font-mono font-bold text-[#944a27] mt-1">
                    Total: ${q.total_amount.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuotationStatus(q.id, 'accepted')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
                  >
                    Accept Quote
                  </button>
                  <button
                    onClick={() => handleQuotationStatus(q.id, 'rejected')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold rounded-lg transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Subscriptions Portfolio */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-indigo-600" />
            My Active Subscriptions
          </h3>
          <p className="text-xs text-slate-500">Your organization's subscribed software licenses and recurring renewal dates</p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No active subscriptions on file for your account. Accept an open quotation above or contact your account representative.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((s: any) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-500">{s.subscription_number}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">{s.product_name} - {s.plan_name}</h4>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Recurring Price</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${s.total_recurring_amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize block">/{s.billing_interval} ({s.quantity} seat{s.quantity > 1 ? 's' : ''})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Next Billing Renewal</span>
                    <span className="font-mono font-bold text-indigo-600 text-sm">{s.next_billing_date}</span>
                    <span className="text-[10px] text-emerald-600 font-medium block">✓ Auto-renew active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History & Receipts */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            Payment History & Receipts
          </h3>
          <p className="text-xs text-slate-500">Audit trail of settled invoices and transaction confirmations</p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
          {payments.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No payment records found.</div>
          ) : (
            payments.map((p: any) => (
              <div key={p.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <span className="font-mono font-bold text-slate-900">{p.payment_number}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="capitalize text-slate-700">{p.payment_method?.replace('_', ' ')}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="font-mono text-slate-400">{p.transaction_reference}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-600 text-sm">${p.amount.toFixed(2)}</span>
                  <span className="block text-[10px] font-mono text-slate-400">{p.paid_at}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
