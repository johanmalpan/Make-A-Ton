import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { discountService } from '../services/discountService';
import { Discount } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Tag, Plus, Copy, Check, Trash2, Calendar, Percent } from 'lucide-react';

export const Discounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>(() => discountService.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState<number>(100);

  const filteredDiscounts = discounts.filter(d =>
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (couponCode: string) => {
    navigator.clipboard?.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    const d = discounts.find(item => item.id === id);
    if (!d) return;
    const nextStatus: 'active' | 'disabled' | 'expired' = d.status === 'active' ? 'disabled' : 'active';
    // update in storage
    const all = discountService.getAll().map(item => item.id === id ? { ...item, status: nextStatus } : item);
    localStorage.setItem('subscriptiq_discounts', JSON.stringify(all));
    setDiscounts(all);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this discount coupon?')) {
      discountService.delete(id);
      setDiscounts(discountService.getAll());
    }
  };

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    discountService.create({
      code: code.toUpperCase().trim(),
      description: description || `${type === 'percentage' ? `${value}% off` : `₹${value} off`} coupon`,
      type,
      value: Number(value),
      validFrom: new Date().toISOString().split('T')[0],
      validUntil,
      usageLimit: Number(usageLimit),
      status: 'active',
    });

    setDiscounts(discountService.getAll());
    setShowModal(false);
    setCode('');
    setDescription('');
    setValue(10);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions & Discounts"
        subtitle="Manage promotional vouchers, customer coupons, and rate card discount rules."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#15966B] hover:bg-[#12805b] text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search coupon or description..."
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredDiscounts.length}</span> coupons
          </div>
        </div>

        {filteredDiscounts.length === 0 ? (
          <EmptyState
            title="No discount coupons found"
            description="Create coupons to provide percentage or fixed INR price reductions."
            actionLabel="Create Coupon"
            onAction={() => setShowModal(true)}
            icon={Tag}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs tracking-wider uppercase">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Benefit</th>
                  <th className="py-3 px-4">Usage / Limit</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredDiscounts.map((discount) => {
                  const usagePercent = discount.usageLimit
                    ? Math.min(100, Math.round((discount.usageCount / discount.usageLimit) * 100))
                    : 0;

                  return (
                    <tr key={discount.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {discount.code}
                          </span>
                          <button
                            onClick={() => handleCopy(discount.code)}
                            title="Copy Code"
                            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                          >
                            {copiedCode === discount.code ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {discount.description && (
                          <div className="text-xs text-slate-500 mt-1">
                            {discount.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          {discount.type === 'percentage' ? (
                            <>
                              <Percent className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{discount.value}% OFF</span>
                            </>
                          ) : (
                            <span className="text-[#101D2D] font-mono">
                              {formatCurrency(discount.value)} FLAT OFF
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {discount.type} concession
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-36">
                          <div className="text-xs font-medium text-slate-700 flex justify-between">
                            <span>{discount.usageCount} used</span>
                            <span className="text-slate-500">limit {discount.usageLimit}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(discount.validUntil)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={discount.status === 'active' ? 'active' : discount.status === 'expired' ? 'past_due' : 'cancelled'}
                          label={discount.status}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(discount.id)}
                            className="text-xs font-medium px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            {discount.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDelete(discount.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 font-heading">Create Promotional Coupon</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDiscount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual partner advance discount"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#15966B] hover:bg-[#12805b] text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
