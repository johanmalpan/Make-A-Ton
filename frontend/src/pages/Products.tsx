import React, { useState } from 'react';
import { Plus, Package, Edit, Trash2, Cpu, RefreshCw, BarChart3, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { ProductForm } from '../components/products/ProductForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Product, ProductType } from '../types/product';
import { formatCurrency } from '../utils/formatCurrency';
import { productService } from '../services/productService';

interface ProductsProps {
  products: Product[];
  onRefresh: () => void;
  onNavigateToPlans: () => void;
}

export const Products: React.FC<ProductsProps> = ({
  products,
  onRefresh,
  onNavigateToPlans,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSaveProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      productService.update(editingProduct.id, data);
    } else {
      productService.create(data);
    }
    setEditingProduct(null);
    onRefresh();
  };

  const handleDeleteConfirm = () => {
    if (deletingProductId) {
      productService.delete(deletingProductId);
      setDeletingProductId(null);
      onRefresh();
    }
  };

  const getProductIcon = (category: string) => {
    if (category.includes('Developer')) return <Cpu className="w-5 h-5 text-purple-600" />;
    if (category.includes('Analytics')) return <BarChart3 className="w-5 h-5 text-blue-600" />;
    if (category.includes('Security')) return <ShieldCheck className="w-5 h-5 text-amber-600" />;
    return <RefreshCw className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products Catalog"
        subtitle="Manage software products, subscription items, cost margins, and variant specifications"
        action={
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search products by title, SKU code, or category..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {['all', 'software', 'service', 'consumable'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                typeFilter === t
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {getProductIcon(product.category)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono text-[11px] text-slate-700 font-semibold">{product.code}</span>
                      <span>·</span>
                      <span className="capitalize">{product.type}</span>
                      <span>·</span>
                      <span>{product.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsFormOpen(true);
                    }}
                    title="Edit Product"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingProductId(product.id)}
                    title="Delete Product"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {product.description}
              </p>

              {product.notes && (
                <div className="mt-2 text-[11px] text-slate-400 italic">
                  Note: {product.notes}
                </div>
              )}

              {/* Variants Pill List */}
              {product.variants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                    Available Variants ({product.variants.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.variants.map((v) => (
                      <span
                        key={v.id}
                        className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                      >
                        {v.name} ({v.priceDelta >= 0 ? `+₹${v.priceDelta}` : `-₹${Math.abs(v.priceDelta)}`})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sales Price</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(product.salesPrice)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cost Price</span>
                  <div className="font-mono font-medium text-slate-500 text-sm">
                    {formatCurrency(product.costPrice)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Gross Margin</span>
                  <div className="font-mono font-semibold text-emerald-700 text-sm">
                    {Math.round(((product.salesPrice - product.costPrice) / product.salesPrice) * 100)}%
                  </div>
                </div>
              </div>

              <button
                onClick={onNavigateToPlans}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View Plans →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
        initialProduct={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProductId}
        title="Delete Product Catalog Item"
        message="Are you sure you want to remove this product? Existing subscriptions referencing this SKU will remain in the database."
        confirmLabel="Delete Product"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProductId(null)}
      />
    </div>
  );
};
