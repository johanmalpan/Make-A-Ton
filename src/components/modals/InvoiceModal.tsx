import React, { useEffect, useState } from 'react';
import { 
  X, 
  Printer, 
  CreditCard, 
  Ban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Calendar,
  Layers,
  Receipt
} from 'lucide-react';
import { api } from '../../services/api';

interface InvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
  onOpenPayment: (invoice: any) => void;
  onInvoiceUpdated: () => void;
  userRole?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoiceId,
  onClose,
  onOpenPayment,
  onInvoiceUpdated,
  userRole
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoice(invoiceId);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this invoice? This action cannot be undone.')) {
      return;
    }
    try {
      await api.voidInvoice(invoiceId);
      onInvoiceUpdated();
      fetchInvoice();
    } catch (err: any) {
      alert(`Error voiding invoice: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Error Loading Invoice</h3>
          <p className="text-sm text-rose-600 mb-4">{error || 'Invoice not found.'}</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { invoice, items, payments } = data;
  const isOverdue = invoice.status === 'overdue' || (invoice.balance_due > 0 && new Date(invoice.due_date) < new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col my-auto border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Top Header Controls (Excluded in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900">{invoice.invoice_number}</span>
            <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
              invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              invoice.status === 'partially_paid' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
              isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' :
              invoice.status === 'void' ? 'bg-slate-200 text-slate-600 border border-slate-300' :
              'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>

            {invoice.balance_due > 0 && invoice.status !== 'void' && (
              <button
                onClick={() => onOpenPayment(invoice)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#944a27] hover:bg-[#833f20] rounded-lg shadow-sm transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" /> Pay Now / Record
              </button>
            )}

            {userRole !== 'customer' && invoice.paid_amount === 0 && invoice.status !== 'void' && (
              <button
                onClick={handleVoid}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg"
              >
                <Ban className="w-3.5 h-3.5" /> Void
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800" id="printable-invoice">
          
          {/* Header Row: Company Info & Invoice Title */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Brightloop Software</h2>
              </div>
              <p className="text-xs text-slate-500">Brightloop Technologies Corp • SubscriptIQ Platform</p>
              <p className="text-xs text-slate-500">100 Tech Enterprise Blvd, Suite 800</p>
              <p className="text-xs text-slate-500">San Francisco, CA 94105 • support@brightloop.com</p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black tracking-wider text-slate-900 uppercase">INVOICE</span>
              <p className="font-mono text-sm font-bold text-indigo-600 mt-1">{invoice.invoice_number}</p>
              {invoice.subscription_number && (
                <p className="text-xs text-slate-500 mt-0.5">Sub: <span className="font-mono font-medium">{invoice.subscription_number}</span></p>
              )}
            </div>
          </div>

          {/* Bill To & Invoice Metadata Cards */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
              <h4 className="text-sm font-bold text-slate-900">{invoice.customer_name}</h4>
              {invoice.customer_company && (
                <p className="text-xs font-medium text-slate-700">{invoice.customer_company}</p>
              )}
              <p className="text-xs text-slate-600 mt-1">{invoice.customer_email}</p>
              {invoice.billing_address && (
                <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{invoice.billing_address}</p>
              )}
              {invoice.tax_id && (
                <p className="text-xs font-mono text-slate-500 mt-1">Tax ID: {invoice.tax_id}</p>
              )}
            </div>

            <div className="text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Issue Date: </span>
                <span className="font-semibold text-slate-800">{invoice.issue_date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Due Date: </span>
                <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                  {invoice.due_date} {isOverdue ? '(Past Due)' : ''}
                </span>
              </div>
              {invoice.period_start && invoice.period_end && (
                <div>
                  <span className="text-slate-400 font-medium">Billing Period: </span>
                  <span className="font-mono text-slate-700">{invoice.period_start} to {invoice.period_end}</span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className={`inline-block mt-0.5 text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 text-left">Description</th>
                  <th className="py-2.5 text-center w-16">Qty</th>
                  <th className="py-2.5 text-right w-24">Unit Price</th>
                  <th className="py-2.5 text-right w-24">Discount</th>
                  <th className="py-2.5 text-right w-24">Tax</th>
                  <th className="py-2.5 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="py-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono text-emerald-600">
                      {item.discount_amount > 0 ? `-$${item.discount_amount.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500">${item.tax_amount.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">${item.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown Calculation */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>

              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discounts Applied</span>
                  <span className="font-mono font-medium">-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Tax Breakdown</span>
                <span className="font-mono font-medium">${invoice.tax_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono">${invoice.total_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                <span>Amount Paid</span>
                <span className="font-mono">-${invoice.paid_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-rose-700 font-bold text-sm p-2 rounded-lg bg-rose-50 border border-rose-100">
                <span>Balance Due</span>
                <span className="font-mono text-base">${invoice.balance_due.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Attached to this Invoice */}
          {payments.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Payments Recorded for this Invoice
              </h5>
              <div className="space-y-1.5">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-mono font-semibold text-slate-900">{p.payment_number}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="capitalize text-slate-600">{p.payment_method.replace('_', ' ')}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-500 font-mono text-[11px]">{p.transaction_reference}</span>
                      {p.status === 'reversed' && (
                        <span className="ml-2 text-[10px] font-bold text-rose-600 uppercase bg-rose-100 px-1.5 py-0.5 rounded">
                          Reversed: {p.reversal_reason}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">${p.amount.toFixed(2)}</span>
                      <span className="block text-[10px] text-slate-400">{p.paid_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
