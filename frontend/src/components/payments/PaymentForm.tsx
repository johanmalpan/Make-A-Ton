import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import { Payment, PaymentMethod } from '../../types/payment';
import { Invoice } from '../../types/invoice';
import { formatCurrency } from '../../utils/formatCurrency';
import { getTodayDateString } from '../../utils/formatDate';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>) => void;
  invoices: Invoice[];
  initialInvoiceId?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  invoices,
  initialInvoiceId,
}) => {
  // Only invoices with an outstanding balance or unpaid
  const payableInvoices = invoices.filter((i) => i.status !== 'paid' || i.outstandingBalance > 0);
  const activeInvoicesList = payableInvoices.length > 0 ? payableInvoices : invoices;

  const [invoiceId, setInvoiceId] = useState(initialInvoiceId || activeInvoicesList[0]?.id || '');
  const selectedInvoice = invoices.find((i) => i.id === invoiceId) || activeInvoicesList[0];

  const [amount, setAmount] = useState(selectedInvoice ? selectedInvoice.outstandingBalance || selectedInvoice.totalAmount : 1000);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleInvoiceChange = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setAmount(inv.outstandingBalance > 0 ? inv.outstandingBalance : inv.totalAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    onSubmit({
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerCompany: selectedInvoice.customerCompany,
      amount: Number(amount),
      paymentDate: `${getTodayDateString()} 12:00:00`,
      method,
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      status: 'succeeded',
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 my-6">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#15966B] text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                Record Invoice Payment
              </h3>
              <p className="text-xs text-slate-500">
                Log settlement against accounts receivable ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Invoice</label>
            <select
              value={invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            >
              {activeInvoicesList.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerCompany} (Due: {formatCurrency(inv.outstandingBalance || inv.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedInvoice.customerCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoiced:</span>
                <span className="font-mono text-slate-800">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Outstanding Balance:</span>
                <span className="font-mono font-bold text-rose-700">{formatCurrency(selectedInvoice.outstandingBalance)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹ INR)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="UPI">UPI AutoPay / QR</option>
                <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
                <option value="NetBanking">Corporate NetBanking</option>
                <option value="CreditCard">Credit Card</option>
                <option value="DebitCard">Debit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref #</label>
              <input
                type="text"
                placeholder="UTR / Bank Ref ID"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Settlement Notes</label>
            <input
              type="text"
              placeholder="e.g. Bank statement confirmation ref"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record & Settle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
