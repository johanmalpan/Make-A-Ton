import React, { useState, useEffect } from 'react';
import { X, Repeat, ShieldCheck, Plus } from 'lucide-react';
import { api } from '../../services/api';

interface SubscriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSuccess }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [discountId, setDiscountId] = useState('');
  const [taxRate, setTaxRate] = useState(18.0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, pList, tList, dList] = await Promise.all([
          api.getCustomers(),
          api.getPlans(),
          api.getTaxes(),
          api.getDiscounts()
        ]);
        setCustomers(cList);
        setPlans(pList);
        setTaxes(tList);
        setDiscounts(dList);

        if (cList.length > 0) setCustomerId(cList[0].id);
        if (pList.length > 0) setPlanId(pList[0].id);
      } catch (err: any) {
        console.error('Error loading subscription references:', err);
      }
    }
    loadData();
  }, []);

  const selectedPlan = plans.find(p => p.id === planId);
  const selectedDiscount = discounts.find(d => d.id === discountId);

  // Live calculation
  const subtotal = selectedPlan ? selectedPlan.price * quantity : 0;
  let discountAmount = 0;
  let discountWarning = '';

  if (selectedDiscount) {
    if (quantity < selectedDiscount.min_quantity) {
      discountWarning = `Requires at least ${selectedDiscount.min_quantity} seats/qty to apply.`;
    } else if (subtotal < selectedDiscount.min_amount) {
      discountWarning = `Requires minimum $${selectedDiscount.min_amount} order.`;
    } else {
      if (selectedDiscount.type === 'percentage') {
        discountAmount = (subtotal * selectedDiscount.value) / 100;
      } else {
        discountAmount = Math.min(subtotal, selectedDiscount.value);
      }
    }
  }

  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxable * taxRate) / 100;
  const recurringTotal = taxable + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !planId) {
      setError('Please select both customer and plan.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createSubscription({
        customer_id: customerId,
        plan_id: planId,
        quantity,
        start_date: startDate,
        discount_id: discountId || null,
        tax_rate: taxRate
      });
      onSuccess();
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
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#944a27] flex items-center justify-center text-white">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Provision Subscription</h3>
              <p className="text-xs text-slate-500">Attach customer to recurring plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company || c.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan *</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.product_name} - {p.name} (${p.price}/{p.billing_interval})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Seats / Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Rule</label>
              <select
                value={discountId}
                onChange={(e) => setDiscountId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id}>{d.code} ({d.name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate</label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {taxes.map(t => (
                  <option key={t.id} value={t.rate_percent}>{t.name} ({t.rate_percent}%)</option>
                ))}
              </select>
            </div>
          </div>

          {discountWarning && (
            <p className="text-[11px] font-medium text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ {discountWarning}
            </p>
          )}

          {/* Pricing Preview Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Billing Interval:</span>
              <span className="font-semibold text-slate-800 capitalize">{selectedPlan?.billing_interval || 'monthly'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({quantity}x):</span>
              <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax ({taxRate}%):</span>
              <span className="font-mono">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-sm pt-1.5 border-t border-slate-200">
              <span>Total Recurring per Cycle:</span>
              <span className="font-mono text-[#944a27]">${recurringTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#944a27] hover:bg-[#833f20] rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
            >
              {loading ? 'Creating...' : 'Activate Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
