import React, { useState, useEffect } from 'react';
import { CreditCard, Search, RotateCcw, CheckCircle2, AlertCircle, FileText, ArrowDownLeft } from 'lucide-react';
import { api } from '../../services/api';

interface PaymentsViewProps {
  onSelectInvoice: (invoiceId: string) => void;
  userRole?: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onSelectInvoice, userRole }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPayments = async () => {
    try {
      setLoading(true);
      const list = await api.getPayments();
      setPayments(list);
    } catch (err: any) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleReverse = async (id: string, paymentNumber: string) => {
    const reason = prompt(`Enter reason for reversing payment ${paymentNumber} (e.g. Chargeback, accidental duplicate, customer refund):`);
    if (!reason) return;

    try {
      await api.reversePayment(id, reason);
      alert(`Payment ${paymentNumber} reversed. The linked invoice balance has been restored.`);
      loadPayments();
    } catch (err: any) {
      alert(`Reversal failed: ${err.message}`);
    }
  };

  const filtered = payments.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const matchNum = p.payment_number.toLowerCase().includes(q);
      const matchInv = p.invoice_number?.toLowerCase().includes(q);
      const matchCust = p.customer_name?.toLowerCase().includes(q);
      const matchRef = p.transaction_reference?.toLowerCase().includes(q);
      return matchNum || matchInv || matchCust || matchRef;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payments & Reconciliation</h2>
          <p className="text-xs text-slate-500">Audit settled receipts, payment gateway references, and reversal logs</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search payment #, invoice, customer, or auth ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#944a27]/20 focus:border-[#944a27]"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <CreditCard className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Payments Recorded</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Recorded payments, settlements, and reconciliation transactions will appear here once invoices are paid.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Gateway Reference</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Reconciliation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.payment_number}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <button
                        onClick={() => onSelectInvoice(p.invoice_id)}
                        className="text-[#944a27] hover:text-[#833f20] font-semibold hover:underline"
                      >
                        {p.invoice_number}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{p.customer_name}</span>
                      {p.customer_company && (
                        <span className="text-[10px] text-slate-400">{p.customer_company}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-700 font-medium">
                      {p.payment_method?.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {p.transaction_reference}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.paid_at}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-slate-900 text-sm">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {p.status}
                      </span>
                      {p.status === 'reversed' && p.reversal_reason && (
                        <span className="block text-[10px] text-rose-600 font-medium mt-0.5 truncate max-w-xs" title={p.reversal_reason}>
                          Reason: {p.reversal_reason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {userRole !== 'customer' && p.status === 'completed' && (
                        <button
                          onClick={() => handleReverse(p.id, p.payment_number)}
                          className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
