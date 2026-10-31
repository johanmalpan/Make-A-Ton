import React, { useState } from 'react';
import { X, Plus, Trash2, Package } from 'lucide-react';
import { Product, ProductType, ProductVariant } from '../../types/product';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialProduct?: Product | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
}) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [code, setCode] = useState(initialProduct?.code || '');
  const [type, setType] = useState<ProductType>(initialProduct?.type || 'software');
  const [category, setCategory] = useState(initialProduct?.category || 'Billing & Subscriptions');
  const [salesPrice, setSalesPrice] = useState(initialProduct?.salesPrice || 4999);
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice || 1200);
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [notes, setNotes] = useState(initialProduct?.notes || '');
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);

  const [varName, setVarName] = useState('');
  const [varSku, setVarSku] = useState('');
  const [varPriceDelta, setVarPriceDelta] = useState(0);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    if (!varName) return;
    setVariants([
      ...variants,
      {
        id: `var-${Date.now()}`,
        name: varName,
        sku: varSku || `${code || 'PROD'}-${varName.toUpperCase().slice(0, 3)}`,
        priceDelta: Number(varPriceDelta) || 0,
      },
    ]);
    setVarName('');
    setVarSku('');
    setVarPriceDelta(0);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSubmit({
      name,
      code: code || `BLP-${Math.floor(100 + Math.random() * 900)}`,
      type,
      category,
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice),
      description,
      notes,
      variants,
      status: 'active',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 my-6">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#15966B] text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                {initialProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500">
                Define product pricing, inventory type, notes, and variants
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
            <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. BrightFlow Core Subscription Engine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Code (SKU)</label>
              <input
                type="text"
                placeholder="BFC-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="software">Software License</option>
                <option value="service">Cloud SaaS Service</option>
                <option value="consumable">Consumable Resource</option>
                <option value="storable">Storable Physical Hardware</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sales Price (₹ INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={salesPrice}
                onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹ INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product functionality overview..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal licensing notes or delivery specifications"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Variants Section */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-2">Product Variants</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Variant Name (e.g. On-Premise)"
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="number"
                placeholder="+₹ Price Delta"
                value={varPriceDelta}
                onChange={(e) => setVarPriceDelta(parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
              >
                Add
              </button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-1 mt-2">
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{v.name}</span>
                      <span className="text-slate-400 font-mono ml-2">SKU: {v.sku}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-700 font-semibold">
                        {v.priceDelta >= 0 ? `+₹${v.priceDelta}` : `-₹${Math.abs(v.priceDelta)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              {initialProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
