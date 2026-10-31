import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';

interface PaymentModalProps {
  invoice: any;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  onClose,
  onPaymentSuccess
}) => {
  const [amount, setAmount] = useState<string>(invoice.balance_due ? invoice.balance_due.toFixed(2) : '0.00');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [reference, setReference] = useState<string>(`TX-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const isOverpaying = numAmount > invoice.balance_due;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount <= 0) {
      setError('Payment amount must be greater than $0.00');
      return;
    }

    if (numAmount > invoice.balance_due) {
      setError(`Overpayment not allowed! Maximum acceptable payment is the balance due ($${invoice.balance_due.toFixed(2)}).`);
      return;
    }

    try {
      setLoading(true);
      await api.recordPayment({
        invoice_id: invoice.id,
        amount: numAmount,
        payment_method: paymentMethod,
        transaction_reference: reference,
        notes: notes || `Payment received via ${paymentMethod}`
      });

      // Trigger celebratory confetti if fully settled
      if (Math.abs(numAmount - invoice.balance_due) < 0.01) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Payment</h3>
              <p className="text-xs text-slate-500 font-mono">Invoice: {invoice.invoice_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Invoice Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-800">{invoice.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total</span>
              <span className="font-mono font-medium text-slate-800">${invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Already Paid</span>
              <span className="font-mono font-medium text-emerald-600">${invoice.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold">
              <span className="text-slate-900">Remaining Balance Due</span>
              <span className="font-mono text-indigo-600 text-base">${invoice.balance_due.toFixed(2)}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Amount with Overpayment Guard */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balance_due}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={`w-full pl-8 pr-4 py-2 text-sm font-mono font-semibold rounded-xl border focus:outline-none focus:ring-2 ${
                  isOverpaying
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
            </div>
            {isOverpaying && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Overpayment guard active: Amount exceeds remaining balance due (${invoice.balance_due.toFixed(2)}).
              </p>
            )}
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(invoice.balance_due.toFixed(2))}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Pay Full Balance (${invoice.balance_due.toFixed(2)})
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setAmount((invoice.balance_due / 2).toFixed(2))}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-800"
              >
                Pay Half (50%)
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="credit_card">Credit / Debit Card (Instant Gateway)</option>
              <option value="stripe_simulation">Stripe Connect Simulator</option>
              <option value="upi">UPI / Instant Digital Wallet</option>
              <option value="bank_transfer">ACH / Wire Bank Transfer</option>
              <option value="cash">Direct Cash / Office Settlement</option>
            </select>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Reference / Auth ID
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TX-984021"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Reconciliation Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes or receipt references"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOverpaying}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#944a27] hover:bg-[#833f20] disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Confirm & Post Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
