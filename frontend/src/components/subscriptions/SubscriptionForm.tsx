import React, { useState } from 'react';
import { X, Repeat, Plus, Trash2 } from 'lucide-react';
import { Subscription, SubscriptionStatus, SubscriptionLineItem } from '../../types/subscription';
import { Customer } from '../../types/customer';
import { SubscriptionPlan } from '../../types/plan';
import { Product } from '../../types/product';
import { calculateTotals } from '../../utils/calculations';
import { addMonths, addYears, getTodayDateString } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Subscription, 'id' | 'subscriptionNumber' | 'createdAt' | 'updatedAt'>) => void;
  customers: Customer[];
  plans: SubscriptionPlan[];
  products: Product[];
  initialSubscription?: Subscription | null;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  plans,
  products,
  initialSubscription,
}) => {
  const [customerId, setCustomerId] = useState(initialSubscription?.customerId || customers[0]?.id || '');
  const [planId, setPlanId] = useState(initialSubscription?.planId || plans[0]?.id || '');
  const [startDate, setStartDate] = useState(initialSubscription?.startDate || getTodayDateString());
  const [status, setStatus] = useState<SubscriptionStatus>(initialSubscription?.status || 'active');
  const [paymentMethod, setPaymentMethod] = useState(initialSubscription?.paymentMethod || 'UPI / NetBanking');
  const [notes, setNotes] = useState(initialSubscription?.notes || '');

  const currentPlan = plans.find((p) => p.id === planId) || plans[0];
  const currentCustomer = customers.find((c) => c.id === customerId) || customers[0];

  const defaultExpiry = currentPlan?.billingCycle === 'yearly'
    ? addYears(startDate, 1)
    : addMonths(startDate, 1);

  const [expiryDate, setExpiryDate] = useState(initialSubscription?.expiryDate || defaultExpiry);

  // Line items state
  const [lineItems, setLineItems] = useState<SubscriptionLineItem[]>(
    initialSubscription?.lineItems || [
      {
        id: `item-${Date.now()}`,
        productId: currentPlan?.productId || products[0]?.id || 'prod-101',
        productName: currentPlan?.name || 'BrightFlow Core',
        quantity: currentPlan?.minQuantity || 1,
        unitPrice: currentPlan?.price || 2499,
        total: (currentPlan?.minQuantity || 1) * (currentPlan?.price || 2499),
      },
    ]
  );

  if (!isOpen) return null;

  const handlePlanChange = (selectedPlanId: string) => {
    setPlanId(selectedPlanId);
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (plan) {
      const newExpiry = plan.billingCycle === 'yearly'
        ? addYears(startDate, 1)
        : addMonths(startDate, 1);
      setExpiryDate(newExpiry);

      setLineItems([
        {
          id: `item-${Date.now()}`,
          productId: plan.productId || products[0]?.id || 'prod-101',
          productName: plan.name,
          quantity: plan.minQuantity || 1,
          unitPrice: plan.price,
          total: (plan.minQuantity || 1) * plan.price,
        },
      ]);
    }
  };

  const handleAddProductItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newItem: SubscriptionLineItem = {
      id: `item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      quantity: 1,
      unitPrice: prod.salesPrice,
      total: prod.salesPrice,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((it) => it.id !== id));
  };

  const totals = calculateTotals(lineItems);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer || !currentPlan) return;

    onSubmit({
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerCompany: currentCustomer.company,
      customerEmail: currentCustomer.email,
      planId: currentPlan.id,
      planName: currentPlan.name,
      billingCycle: currentPlan.billingCycle,
      startDate,
      expiryDate,
      nextRenewalDate: expiryDate,
      lineItems,
      quantity: lineItems.reduce((acc, it) => acc + it.quantity, 0),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.total,
      autoRenew: true,
      status,
      paymentMethod,
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
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                {initialSubscription ? 'Edit Subscription Contract' : 'Create New Subscription'}
              </h3>
              <p className="text-xs text-slate-500">
                Odoo recurring contract with items, quantity, start & renewal schedule
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
              <label className="block font-semibold text-slate-700 mb-1">Customer / Organization</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
              <select
                value={planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)}/{p.billingCycle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Renewal / Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contract Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="active">Active</option>
                <option value="in_trial">In Trial</option>
                <option value="pending">Pending PO</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Product Items Breakdown */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700">Contract Product Items</label>
              <div className="flex items-center gap-1">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddProductItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-2 py-1 text-[11px] bg-slate-100 border border-slate-200 rounded"
                >
                  <option value="" disabled>+ Add Product Item</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.salesPrice)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex-1 truncate pr-2">
                    <div className="font-semibold text-slate-900 truncate">{item.productName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-[11px] text-emerald-800 font-semibold block uppercase">Calculated Total (incl. 18% GST)</span>
              <span className="font-mono text-slate-500">Subtotal: {formatCurrency(totals.subtotal)} + GST: {formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="font-heading font-extrabold text-lg text-emerald-900 tabular-nums">
              {formatCurrency(totals.total)}
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
              {initialSubscription ? 'Update Subscription' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
