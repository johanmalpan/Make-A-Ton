import React, { useState, useEffect } from 'react';
import { Package, Plus, Layers, Tag, Calendar, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { api } from '../../services/api';

interface CatalogViewProps {
  userRole?: string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ userRole }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('Enterprise Core');

  // New Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [planProdId, setPlanProdId] = useState('');
  const [planInterval, setPlanInterval] = useState('monthly');
  const [planPrice, setPlanPrice] = useState('199.00');
  const [planTrial, setPlanTrial] = useState(0);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [prodList, planList] = await Promise.all([
        api.getProducts(),
        api.getPlans(),
      ]);
      setProducts(prodList);
      setPlans(planList);
      if (prodList.length > 0 && !planProdId) {
        setPlanProdId(prodList[0].id);
      }
    } catch (err: any) {
      console.error('Error loading catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: prodName,
        code: prodCode,
        description: prodDesc,
        category: prodCat
      });
      setShowProductModal(false);
      setProdName('');
      setProdCode('');
      setProdDesc('');
      loadCatalog();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlan({
        name: planName,
        code: planCode,
        product_id: planProdId,
        billing_interval: planInterval,
        interval_count: 1,
        price: parseFloat(planPrice) || 0,
        trial_days: planTrial
      });
      setShowPlanModal(false);
      setPlanName('');
      setPlanCode('');
      loadCatalog();
    } catch (err: any) {
      alert(`Error creating plan: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Products, Variants & Subscription Plans</h2>
          <p className="text-xs text-slate-500">Configure catalog software offerings, editions, and multi-interval billing schedules</p>
        </div>

        {userRole !== 'customer' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Subscription Plan
            </button>
          </div>
        )}
      </div>

      {/* Subscription Plans Matrix */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#944a27]" />
          Active Subscription Plans (Daily, Weekly, Monthly, Yearly)
        </h3>

        {plans.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No Subscription Plans Configured</p>
            <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 mb-3">
              Configure billing frequencies (daily, weekly, monthly, yearly) and pricing intervals.
            </p>
            {userRole !== 'customer' && (
              <button
                onClick={() => {
                  if (products.length === 0) {
                    alert('Please add at least one product before creating a subscription plan.');
                    setShowProductModal(true);
                  } else {
                    setShowPlanModal(true);
                  }
                }}
                className="px-3 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                + Add First Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#944a27] bg-[#944a27]/10 px-2 py-0.5 rounded-full border border-[#944a27]/20">
                        {p.billing_interval} billing
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-2">{p.name}</h4>
                      <p className="text-xs text-slate-500">{p.product_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black font-mono text-slate-900">${p.price}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">/{p.billing_interval}</span>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{p.description}</p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Code: <span className="font-mono font-semibold text-slate-700">{p.code}</span></span>
                    {p.trial_days > 0 && (
                      <span className="font-semibold text-emerald-600">{p.trial_days}-Day Trial</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products & Variants Catalog */}
      <div className="pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#944a27]" />
          Products & Variant Matrix
        </h3>

        {products.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/80">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No Products in Catalog</p>
            <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 mb-3">
              Define your software services, add-ons, and recurring product lines to attach pricing plans.
            </p>
            {userRole !== 'customer' && (
              <button
                onClick={() => setShowProductModal(true)}
                className="px-3 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                + Create First Product
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(prod => (
            <div key={prod.id} className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {prod.code.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{prod.name}</h4>
                    <p className="text-xs text-slate-500">{prod.category} • Code: <span className="font-mono">{prod.code}</span></p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 max-w-md">{prod.description}</p>
              </div>

              {/* Variants Matrix */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Editions & Variants</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {prod.variants.map((v: any) => (
                    <div key={v.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{v.name}</span>
                        {v.price_adjustment > 0 && (
                          <span className="font-mono font-semibold text-indigo-600">+${v.price_adjustment}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">SKU: {v.sku}</span>
                      {v.attributes_json && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                          {Object.entries(JSON.parse(v.attributes_json || '{}')).map(([k, val]) => (
                            <span key={k} className="mr-2">
                              <strong className="capitalize">{k}:</strong> {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* New Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Software Product</h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brightloop DevOps Suite"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BL-DEVOPS"
                  value={prodCode}
                  onChange={(e) => setProdCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={prodCat}
                  onChange={(e) => setProdCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#944a27] hover:bg-[#833f20] text-white rounded-lg font-semibold shadow-2xs transition-all text-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Subscription Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={planProdId}
                  onChange={(e) => setPlanProdId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Annual"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CLD-Y-ENT"
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Interval *</label>
                  <select
                    value={planInterval}
                    onChange={(e) => setPlanInterval(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trial Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={planTrial}
                  onChange={(e) => setPlanTrial(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#944a27] hover:bg-[#833f20] text-white rounded-lg font-semibold shadow-2xs transition-all text-xs"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
