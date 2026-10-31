import React, { useState, useEffect } from 'react';
import { X, FileCheck2, Plus, Trash2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface QuotationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  quotationToView?: any;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  onClose,
  onSuccess,
  quotationToView
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [terms, setTerms] = useState('Payment due within 30 days of invoice date. All digital licenses subject to Brightloop standard SLA.');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([
    { plan_id: '', quantity: 1, unit_price: 0, discount_id: '', tax_rate: 18.0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, pList, tList, dList, tmplList] = await Promise.all([
          api.getCustomers(),
          api.getPlans(),
          api.getTaxes(),
          api.getDiscounts(),
          api.getTemplates(),
        ]);
        setCustomers(cList);
        setPlans(pList);
        setTaxes(tList);
        setDiscounts(dList);
        setTemplates(tmplList);

        if (pList.length > 0 && !items[0].plan_id) {
          setItems([{
            plan_id: pList[0].id,
            quantity: 1,
            unit_price: pList[0].price,
            discount_id: '',
            tax_rate: 18.0
          }]);
        }
        if (cList.length > 0) {
          setCustomerId(cList[0].id);
        }
      } catch (err: any) {
        console.error('Error loading quotation references:', err);
      }
    }
    loadData();
  }, []);

  // Apply template
  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;

    const matchedPlan = plans.find(p => p.id === tmpl.plan_id);
    if (matchedPlan) {
      setItems([{
        plan_id: matchedPlan.id,
        quantity: tmpl.default_quantity || 1,
        unit_price: matchedPlan.price,
        discount_id: tmpl.default_discount_id || '',
        tax_rate: 18.0
      }]);
    }
    if (tmpl.terms) {
      setTerms(tmpl.terms);
    }
  };

  const updateItem = (index: number, field: string, val: any) => {
    const updated = [...items];
    updated[index][field] = val;

    if (field === 'plan_id') {
      const p = plans.find(plan => plan.id === val);
      if (p) {
        updated[index].unit_price = p.price;
      }
    }
    setItems(updated);
  };

  const addItem = () => {
    if (plans.length === 0) return;
    setItems([
      ...items,
      {
        plan_id: plans[0].id,
        quantity: 1,
        unit_price: plans[0].price,
        discount_id: '',
        tax_rate: 18.0
      }
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Compute live breakdown
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalAmount = 0;

  const calculatedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    const lineSubtotal = qty * price;

    let lineDiscount = 0;
    let discountWarning = '';

    if (item.discount_id) {
      const disc = discounts.find(d => d.id === item.discount_id);
      if (disc) {
        if (qty < disc.min_quantity) {
          discountWarning = `Min. ${disc.min_quantity} qty required for ${disc.code}`;
        } else if (lineSubtotal < disc.min_amount) {
          discountWarning = `Min. $${disc.min_amount} order required`;
        } else {
          if (disc.type === 'percentage') {
            lineDiscount = Number(((lineSubtotal * disc.value) / 100).toFixed(2));
          } else {
            lineDiscount = Math.min(lineSubtotal, disc.value);
          }
        }
      }
    }

    const taxable = Math.max(0, lineSubtotal - lineDiscount);
    const lineTax = Number(((taxable * (item.tax_rate || 0)) / 100).toFixed(2));
    const lineTotal = Number((taxable + lineTax).toFixed(2));

    subtotal += lineSubtotal;
    totalDiscount += lineDiscount;
    totalTax += lineTax;
    totalAmount += lineTotal;

    return {
      ...item,
      lineSubtotal,
      lineDiscount,
      discountWarning,
      taxable,
      lineTax,
      lineTotal
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    try {
      setLoading(true);
      await api.createQuotation({
        customer_id: customerId,
        valid_until: validUntil,
        terms,
        notes,
        items: items.map(i => ({
          plan_id: i.plan_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount_id: i.discount_id || null,
          tax_rate: Number(i.tax_rate)
        }))
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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Subscription Quotation</h3>
              <p className="text-xs text-slate-500">Configure recurring plan items, dynamic discounts, and terms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Quotation Template Quick-loader */}
          {templates.length > 0 && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-indigo-900">Load from Pre-defined Quotation Template:</span>
              </div>
              <select
                onChange={(e) => handleApplyTemplate(e.target.value)}
                defaultValue=""
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Select a template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Customer & Valid Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''} - {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valid Until *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Subscription Plan Items
              </h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>
            </div>

            <div className="space-y-3">
              {calculatedItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    
                    {/* Plan Picker */}
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subscription Plan</label>
                      <select
                        value={item.plan_id}
                        onChange={(e) => updateItem(idx, 'plan_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} - {p.name} (${p.price}/{p.billing_interval})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Seats / Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    {/* Discount Rule */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Discount Rule</label>
                      <select
                        value={item.discount_id}
                        onChange={(e) => updateItem(idx, 'discount_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="">No Discount</option>
                        {discounts.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.code} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tax Rate */}
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tax</label>
                      <select
                        value={item.tax_rate}
                        onChange={(e) => updateItem(idx, 'tax_rate', parseFloat(e.target.value))}
                        className="w-full px-1.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white"
                      >
                        {taxes.map(t => (
                          <option key={t.id} value={t.rate_percent}>{t.rate_percent}%</option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Item Button */}
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line Calculation Info & Condition Warning */}
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200/60 text-slate-500">
                    <div>
                      {item.discountWarning ? (
                        <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠️ {item.discountWarning}
                        </span>
                      ) : item.lineDiscount > 0 ? (
                        <span className="font-semibold text-emerald-600">
                          ✓ Discount saved -${item.lineDiscount.toFixed(2)}
                        </span>
                      ) : null}
                    </div>

                    <div className="font-mono">
                      <span>Subtotal: ${item.lineSubtotal.toFixed(2)}</span>
                      <span className="mx-2">•</span>
                      <span>Tax: ${item.lineTax.toFixed(2)}</span>
                      <span className="mx-2">•</span>
                      <span className="font-bold text-slate-900">Total: ${item.lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quotation Terms and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional quotation notes..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
            <div className="space-y-0.5 text-xs text-slate-400">
              <p>Items Subtotal: <span className="font-mono text-white">${subtotal.toFixed(2)}</span></p>
              {totalDiscount > 0 && (
                <p>Total Discount: <span className="font-mono text-emerald-400">-${totalDiscount.toFixed(2)}</span></p>
              )}
              <p>Total Estimated Tax: <span className="font-mono text-white">${totalTax.toFixed(2)}</span></p>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Quotation Total</span>
              <span className="text-2xl font-black font-mono text-[#944a27]">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
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
              {loading ? 'Creating...' : 'Save & Issue Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
