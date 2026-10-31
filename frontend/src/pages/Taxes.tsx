import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { EmptyState } from '../components/common/EmptyState';
import { Tax } from '../types';
import { INITIAL_TAXES } from '../data/mockData';
import { Receipt, Plus, CheckCircle2, Trash2, Info, Star } from 'lucide-react';

const STORAGE_KEY = 'subscriptiq_taxes';

export const Taxes: React.FC = () => {
  const [taxes, setTaxes] = useState<Tax[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TAXES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [rate, setRate] = useState<number>(18);
  const [type, setType] = useState<Tax['type']>('GST');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taxes));
    } catch (e) {
      console.error(e);
    }
  }, [taxes]);

  const filteredTaxes = taxes.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSetDefault = (id: string) => {
    setTaxes(taxes.map(t => ({
      ...t,
      isDefault: t.id === id,
    })));
  };

  const handleDelete = (id: string) => {
    const taxToDelete = taxes.find(t => t.id === id);
    if (taxToDelete?.isDefault) {
      alert('Cannot delete the default tax rule. Set another rule as default first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this tax rule?')) {
      setTaxes(taxes.filter(t => t.id !== id));
    }
  };

  const handleCreateTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newTax: Tax = {
      id: `tax-${Date.now().toString().slice(-4)}`,
      name,
      code: code.toUpperCase().replace(/\s+/g, '_'),
      rate: Number(rate),
      type,
      description,
      isDefault: isDefault || taxes.length === 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (newTax.isDefault) {
      setTaxes(taxes.map(t => ({ ...t, isDefault: false })).concat(newTax));
    } else {
      setTaxes([...taxes, newTax]);
    }

    setShowModal(false);
    setName('');
    setCode('');
    setRate(18);
    setDescription('');
    setIsDefault(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxes & Fiscal Positions"
        subtitle="Configure Indian GST, IGST, and international export fiscal positions for subscription billing."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#15966B] hover:bg-[#12805b] text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Tax Rate
          </button>
        }
      />

      {/* Info Callout */}
      <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 flex items-start gap-3 text-sm text-emerald-950">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-900">
            Automated Indian GST Rule Assignment
          </p>
          <p className="text-emerald-800 text-xs">
            SubscriptIQ automatically assesses the subscriber's GSTIN state code. For intra-state (Maharashtra - Code 27), CGST 9% + SGST 9% is broken down. For inter-state supplies across India, IGST 18% is automatically applied to recurring invoices.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tax rule or code..."
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredTaxes.length}</span> tax definitions
          </div>
        </div>

        {filteredTaxes.length === 0 ? (
          <EmptyState
            title="No tax rules found"
            description="Add tax rules to automatically calculate GST on subscription checkout and renewals."
            actionLabel="Add Tax Rate"
            onAction={() => setShowModal(true)}
            icon={Receipt}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs tracking-wider uppercase">
                <tr>
                  <th className="py-3 px-4">Tax Name & Description</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Tax Rate</th>
                  <th className="py-3 px-4">Default Rule</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredTaxes.map((tax) => (
                  <tr key={tax.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{tax.name}</div>
                      <div className="text-xs text-slate-500 max-w-md line-clamp-1 mt-0.5">
                        {tax.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {tax.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {tax.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {tax.rate.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4">
                      {tax.isDefault ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Default Rate
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(tax.id)}
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors hover:underline"
                        >
                          <Star className="w-3 h-3 text-slate-400" />
                          Set as Default
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!tax.isDefault && (
                        <button
                          onClick={() => handleDelete(tax.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Delete Tax Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Tax Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 font-heading">Add Tax Rate</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTax} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tax Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST 5% (Reduced rate)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Tax Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="GST_5"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Percentage Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tax Classification
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Tax['type'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                >
                  <option value="GST">GST (Intra-state CGST + SGST)</option>
                  <option value="IGST">IGST (Inter-state)</option>
                  <option value="CGST_SGST">CGST / SGST Explicit</option>
                  <option value="Exempt">Exempt / Zero Rated (SEZ/Export)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on statutory applicability..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="isDefaultCheckbox" className="text-sm text-slate-700">
                  Set as default tax rule for standard recurring lines
                </label>
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
                  Save Tax Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
