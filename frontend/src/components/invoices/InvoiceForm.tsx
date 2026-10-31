import React, { useState } from 'react';
import { X, FileText, Plus, Trash2 } from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceItem } from '../../types/invoice';
import { Customer } from '../../types/customer';
import { Subscription } from '../../types/subscription';
import { calculateTotals } from '../../utils/calculations';
import { addDays, getTodayDateString } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'outstandingBalance'>) => void;
  customers: Customer[];
  subscriptions: Subscription[];
  initialInvoice?: Invoice | null;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  subscriptions,
  initialInvoice,
}) => {
  const [customerId, setCustomerId] = useState(initialInvoice?.customerId || customers[0]?.id || '');
  const [subscriptionId, setSubscriptionId] = useState(initialInvoice?.subscriptionId || '');
  const [issueDate, setIssueDate] = useState(initialInvoice?.issueDate || getTodayDateString());
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || addDays(getTodayDateString(), 15));
  const [status, setStatus] = useState<InvoiceStatus>(initialInvoice?.status || 'posted');
  const [paymentTerms, setPaymentTerms] = useState(initialInvoice?.paymentTerms || 'Net 15 Days');
  const [notes, setNotes] = useState(initialInvoice?.notes || '');

  const [items, setItems] = useState<InvoiceItem[]>(
    initialInvoice?.items || [
      {
        id: `inv-item-${Date.now()}`,
        description: 'BrightFlow Enterprise Cloud Subscription — Recurring Period',
        quantity: 1,
        unitPrice: 7999,
        taxRate: 18,
        taxAmount: (7999 * 18) / 100,
        total: 7999 * 1.18,
      },
    ]
  );

  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(2499);
  const [newItemQty, setNewItemQty] = useState(1);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === customerId) || customers[0];

  const handleAddItem = () => {
    if (!newItemDesc) return;
    const taxAmt = (newItemPrice * newItemQty * 18) / 100;
    const itemTotal = newItemPrice * newItemQty + taxAmt;
    setItems([
      ...items,
      {
        id: `inv-item-${Date.now()}`,
        description: newItemDesc,
        quantity: newItemQty,
        unitPrice: newItemPrice,
        taxRate: 18,
        taxAmount: taxAmt,
        total: itemTotal,
      },
    ]);
    setNewItemDesc('');
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const totals = calculateTotals(items);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const sub = subscriptions.find((s) => s.id === subscriptionId);

    onSubmit({
      subscriptionId: subscriptionId || undefined,
      subscriptionNumber: sub?.subscriptionNumber,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerCompany: currentCustomer.company,
      customerEmail: currentCustomer.email,
      issueDate,
      dueDate,
      items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.total,
      paidAmount: initialInvoice?.paidAmount || 0,
      status,
      paymentTerms,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 my-6">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#15966B] text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                {initialInvoice ? 'Edit Tax Invoice' : 'Create Tax Invoice'}
              </h3>
              <p className="text-xs text-slate-500">
                Generate recurrent invoice with line items, GST breakdown, and due terms
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billed Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subscription Contract (Optional)</label>
              <select
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="">None / Direct Enterprise Billing</option>
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subscriptionNumber || s.id} — {s.planName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="posted">Posted (Awaiting Payment)</option>
                <option value="paid">Paid in Full</option>
                <option value="partial">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Internal Draft</option>
              </select>
            </div>
          </div>

          {/* Line items table */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-2">Invoice Line Items</label>
            <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="truncate flex-1 pr-2">
                    <div className="font-semibold text-slate-900 truncate">{it.description}</div>
                    <div className="text-[11px] text-slate-400">
                      Qty: {it.quantity} × {formatCurrency(it.unitPrice)} (+18% GST)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(it.total)}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(it.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Item description (e.g. Annual Support)"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="number"
                placeholder="Rate (₹)"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 text-xs"
              >
                Add Line
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500 block">Subtotal: {formatCurrency(totals.subtotal)} | 18% GST: {formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="font-heading font-extrabold text-base text-slate-900 tabular-nums">
              Total: {formatCurrency(totals.total)}
            </div>
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
              className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {initialInvoice ? 'Update Invoice' : 'Issue Tax Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
