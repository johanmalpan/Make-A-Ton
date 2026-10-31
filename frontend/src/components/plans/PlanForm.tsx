import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { SubscriptionPlan, BillingCycle, RenewalRule } from '../../types/plan';
import { Product } from '../../types/product';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  products: Product[];
  initialPlan?: SubscriptionPlan | null;
}

export const PlanForm: React.FC<PlanFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  initialPlan,
}) => {
  const [name, setName] = useState(initialPlan?.name || '');
  const [code, setCode] = useState(initialPlan?.code || '');
  const [description, setDescription] = useState(initialPlan?.description || '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialPlan?.billingCycle || 'monthly');
  const [price, setPrice] = useState(initialPlan?.price || 2499);
  const [minQuantity, setMinQuantity] = useState(initialPlan?.minQuantity || 1);
  const [trialDays, setTrialDays] = useState(initialPlan?.trialDays || 14);
  const [availableFrom, setAvailableFrom] = useState(initialPlan?.availableFrom || '');
  const [availableUntil, setAvailableUntil] = useState(initialPlan?.availableUntil || '');
  const [renewalRule, setRenewalRule] = useState<RenewalRule>(initialPlan?.renewalRule || 'auto_renew');
  const [targetAudience, setTargetAudience] = useState(initialPlan?.targetAudience || 'For scaling tech companies');
  const [featuresText, setFeaturesText] = useState(initialPlan?.features.join(', ') || 'Up to 500 active subscriptions, Automated GST Invoicing, Odoo Sync');
  const [productId, setProductId] = useState(initialPlan?.productId || products[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSubmit({
      name,
      code: code || `PLAN-${name.replace(/\s+/g, '-').toUpperCase().slice(0, 8)}`,
      description,
      billingCycle,
      price: Number(price),
      minQuantity: Number(minQuantity) || 1,
      trialDays: Number(trialDays) || 0,
      availableFrom: availableFrom || undefined,
      availableUntil: availableUntil || undefined,
      renewalRule,
      targetAudience,
      features: featuresText.split(',').map((f) => f.trim()).filter(Boolean),
      status: 'active',
      productId: productId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 my-6">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#15966B] text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                {initialPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure cadence (daily, weekly, monthly, yearly), minimum quantity, and renewal rules
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
            <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. BrightFlow Enterprise Annual"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Cycle Cadence</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="daily">Daily Cycle</option>
                <option value="weekly">Weekly Cycle</option>
                <option value="monthly">Monthly Cycle</option>
                <option value="yearly">Yearly Cycle</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Price per Cycle (₹ INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Quantity (Seats)</label>
              <input
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trial Window (Days)</label>
              <input
                type="number"
                min="0"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Renewal Rule</label>
              <select
                value={renewalRule}
                onChange={(e) => setRenewalRule(e.target.value as RenewalRule)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="auto_renew">Auto Renew</option>
                <option value="manual_renew">Manual Renew</option>
                <option value="expire">Expire Contract</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Available From (Optional)</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Available Until (Optional)</label>
              <input
                type="date"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Associated Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. For startups and growth-stage teams"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Features (comma-separated)</label>
            <textarea
              rows={2}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
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
              className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {initialPlan ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
