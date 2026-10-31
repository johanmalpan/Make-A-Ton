import React, { useState } from 'react';
import { Plus, Layers, Edit, Trash2, Check, ArrowRight, Calendar } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { PlanForm } from '../components/plans/PlanForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SubscriptionPlan, BillingCycle } from '../types/plan';
import { Product } from '../types/product';
import { formatCurrency } from '../utils/formatCurrency';
import { planService } from '../services/planService';

interface PlansProps {
  plans: SubscriptionPlan[];
  products: Product[];
  onRefresh: () => void;
  onSelectPlanToSubscribe: (plan: SubscriptionPlan) => void;
}

export const Plans: React.FC<PlansProps> = ({
  plans,
  products,
  onRefresh,
  onSelectPlanToSubscribe,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const filtered = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = cycleFilter === 'all' || p.billingCycle === cycleFilter;
    return matchesSearch && matchesCycle;
  });

  const handleSavePlan = (data: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPlan) {
      planService.update(editingPlan.id, data);
    } else {
      planService.create(data);
    }
    setEditingPlan(null);
    onRefresh();
  };

  const handleDeleteConfirm = () => {
    if (deletingPlanId) {
      planService.delete(deletingPlanId);
      setDeletingPlanId(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans & Tiers"
        subtitle="Manage daily, weekly, monthly, and yearly recurring intervals, minimum seat limits, and renewal rules"
        action={
          <button
            onClick={() => {
              setEditingPlan(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        }
      />

      {/* Filter and Cadence Segmented Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search plans by name, code, or audience..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto overflow-x-auto">
          {['all', 'daily', 'weekly', 'monthly', 'yearly'].map((c) => (
            <button
              key={c}
              onClick={() => setCycleFilter(c)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap ${
                cycleFilter === c
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c === 'all' ? 'All Cadences' : `${c} Cycle`}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {plan.code}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsFormOpen(true);
                    }}
                    title="Edit Plan"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingPlanId(plan.id)}
                    title="Delete Plan"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-heading font-bold text-lg text-slate-900 mt-2">
                {plan.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 italic">
                {plan.targetAudience}
              </p>

              {/* Price Banner */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline gap-1">
                <span className="font-heading font-bold text-3xl text-slate-900 tabular-nums">
                  {formatCurrency(plan.price, false)}
                </span>
                <span className="text-xs text-slate-500 font-medium capitalize">
                  /{plan.billingCycle}
                </span>
                {plan.trialDays > 0 && (
                  <span className="ml-auto text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {plan.trialDays}-Day Free Trial
                  </span>
                )}
              </div>

              {/* Renewal Rule & Min Quantity Info */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                <span>Min Qty: <strong className="text-slate-900 font-mono">{plan.minQuantity} seat(s)</strong></span>
                <span>Rule: <strong className="text-slate-900 capitalize">{plan.renewalRule.replace('_', ' ')}</strong></span>
              </div>

              {/* Features List */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Included Entitlements
                </span>
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Billing: <strong className="capitalize text-slate-800">{plan.billingCycle}</strong>
              </span>

              <button
                onClick={() => onSelectPlanToSubscribe(plan)}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>New Contract</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      <PlanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={handleSavePlan}
        products={products}
        initialPlan={editingPlan}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPlanId}
        title="Delete Subscription Plan"
        message="Are you sure you want to remove this plan? Existing active subscriptions will retain their contract terms."
        confirmLabel="Delete Plan"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPlanId(null)}
      />
    </div>
  );
};
