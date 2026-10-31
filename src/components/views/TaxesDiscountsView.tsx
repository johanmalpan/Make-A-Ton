import React, { useState, useEffect } from 'react';
import { Percent, Plus, Tag, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../../services/api';

interface TaxesDiscountsViewProps {
  userRole?: string;
}

export const TaxesDiscountsView: React.FC<TaxesDiscountsViewProps> = ({ userRole }) => {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Tax Modal
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('18.0');
  const [taxDesc, setTaxDesc] = useState('');
  const [taxDefault, setTaxDefault] = useState(false);

  // New Discount Modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discCode, setDiscCode] = useState('');
  const [discName, setDiscName] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discValue, setDiscValue] = useState('10');
  const [discMinQty, setDiscMinQty] = useState(1);
  const [discMinAmt, setDiscMinAmt] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, dList] = await Promise.all([
        api.getTaxes(),
        api.getDiscounts()
      ]);
      setTaxes(tList);
      setDiscounts(dList);
    } catch (err: any) {
      console.error('Error loading taxes and discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTax({
        name: taxName,
        rate_percent: parseFloat(taxRate) || 0,
        is_default: taxDefault,
        description: taxDesc
      });
      setShowTaxModal(false);
      setTaxName('');
      setTaxDesc('');
      loadData();
    } catch (err: any) {
      alert(`Error creating tax: ${err.message}`);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDiscount({
        code: discCode,
        name: discName,
        type: discType,
        value: parseFloat(discValue) || 0,
        min_quantity: discMinQty,
        min_amount: discMinAmt
      });
      setShowDiscountModal(false);
      setDiscCode('');
      setDiscName('');
      loadData();
    } catch (err: any) {
      alert(`Error creating discount: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tax Rates & Dynamic Discounts</h2>
          <p className="text-xs text-slate-500">Configure global tax jurisdictions, seat volume conditions, and coupon rules</p>
        </div>

        {userRole !== 'customer' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTaxModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Tax Jurisdiction
            </button>
            <button
              onClick={() => setShowDiscountModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Discount Rule
            </button>
          </div>
        )}
      </div>

      {/* Grid: Taxes & Discounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Taxes Panel */}
        <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#944a27]/10 text-[#944a27] flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tax Rates & Jurisdictions</h3>
                <p className="text-xs text-slate-500">Applied dynamically to invoices & quotations</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">{taxes.length} active</span>
          </div>

          {taxes.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl">
              <Percent className="w-6 h-6 text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No Tax Rates Defined</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5 mb-2.5">
                Set up sales tax, VAT, or GST rates to automatically calculate during quotation and invoice generation.
              </p>
              {userRole !== 'customer' && (
                <button
                  onClick={() => setShowTaxModal(true)}
                  className="px-3 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  + Add Tax Rate
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {taxes.map(t => (
                <div key={t.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.name}</span>
                      {t.is_default === 1 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          Default Rate
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-slate-900">{t.rate_percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discounts Panel with Minimum Quantity Rules */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Volume & Tiered Discounts</h3>
                <p className="text-xs text-slate-500">Enforced strictly with minimum quantity & order thresholds</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">{discounts.length} rules</span>
          </div>

          {discounts.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl">
              <Tag className="w-6 h-6 text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No Discounts Configured</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5 mb-2.5">
                Create promotional discount codes with volume and minimum quantity thresholds.
              </p>
              {userRole !== 'customer' && (
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="px-3 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  + Add Discount Rule
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {discounts.map(d => (
              <div key={d.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#944a27] bg-[#944a27]/10 px-2 py-0.5 rounded border border-[#944a27]/20">
                      {d.code}
                    </span>
                    <span className="font-bold text-slate-900">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>Min. Seats: <strong className="text-slate-700">{d.min_quantity}</strong></span>
                    {d.min_amount > 0 && (
                      <>
                        <span>•</span>
                        <span>Min. Order: <strong className="text-slate-700">${d.min_amount}</strong></span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-emerald-600">
                    {d.type === 'percentage' ? `${d.value}% OFF` : `$${d.value} OFF`}
                  </span>
                  <span className="block text-[10px] text-slate-400 capitalize">{d.type} rebate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* New Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Tax Rate</h3>
              <button onClick={() => setShowTaxModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTax} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canadian GST (5%)"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Digital services federal excise"
                  value={taxDesc}
                  onChange={(e) => setTaxDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxDef"
                  checked={taxDefault}
                  onChange={(e) => setTaxDefault(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="taxDef" className="font-medium text-slate-700">Set as default tax rate</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#944a27] hover:bg-[#833f20] text-white rounded-lg font-semibold shadow-2xs transition-all text-xs"
                >
                  Save Tax
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Discount Rule</h3>
              <button onClick={() => setShowDiscountModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PROMO25"
                    value={discCode}
                    onChange={(e) => setDiscCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Growth Volume Tier (5+ seats)"
                  value={discName}
                  onChange={(e) => setDiscName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min. Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={discMinQty}
                    onChange={(e) => setDiscMinQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min. Order ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={discMinAmt}
                    onChange={(e) => setDiscMinAmt(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#944a27] hover:bg-[#833f20] text-white rounded-lg font-semibold shadow-2xs transition-all text-xs"
                >
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
