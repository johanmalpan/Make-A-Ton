
import React, { useState } from 'react';
import { Plus, Edit, Trash2, FilePlus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Subscription, SubscriptionStatus } from '../types/subscription';
import { Customer } from '../types/customer';
import { SubscriptionPlan } from '../types/plan';
import { Product } from '../types/product';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { subscriptionService } from '../services/subscriptionService';
import { invoiceService } from '../services/invoiceService';

interface SubscriptionsProps {
  subscriptions: Subscription[];
  customers: Customer[];
  plans: SubscriptionPlan[];
  products: Product[];
  onRefresh: () => void;
  onSelectSubscription: (sub: Subscription) => void;
  onNavigateToInvoices: () => void;
}

export const Subscriptions: React.FC<SubscriptionsProps> = ({
  subscriptions,
  customers,
  plans,
  products,
  onRefresh,
  onSelectSubscription,
  onNavigateToInvoices,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const filtered = subscriptions.filter((s) => {
    const matchesSearch =
      s.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || s.status === statusFilter;

    const matchesCycle =
      cycleFilter === 'all' || s.billingCycle === cycleFilter;

    return matchesSearch && matchesStatus && matchesCycle;
  });

  const handleSaveSubscription = (
    data: Omit<
      Subscription,
      'id' | 'subscriptionNumber' | 'createdAt' | 'updatedAt'
    >
  ) => {
    if (editingSub) {
      subscriptionService.update(editingSub.id, data);
    } else {
      subscriptionService.create(data);
    }

    setEditingSub(null);
    onRefresh();
  };

  const handleGenerateInvoice = (
    e: React.MouseEvent,
    sub: Subscription
  ) => {
    e.stopPropagation();

    const inv = invoiceService.createFromSubscription(sub);

    alert(
      `Cycle invoice ${inv.invoiceNumber} created for ${sub.customerCompany}!`
    );

    onRefresh();
    onNavigateToInvoices();
  };

  const handleToggleStatus = (
    e: React.MouseEvent,
    sub: Subscription
  ) => {
    e.stopPropagation();

    const newStatus: SubscriptionStatus =
      sub.status === 'active' ? 'past_due' : 'active';

    subscriptionService.updateStatus(sub.id, newStatus);
    onRefresh();
  };

  const handleDeleteConfirm = () => {
    if (deletingSubId) {
      subscriptionService.delete(deletingSubId);
      setDeletingSubId(null);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions Ledger"
        subtitle="Manage customer recurring contracts, seat allocations, automatic billing cycles, and renewal tracking"
        action={
          <button
            onClick={() => {
              setEditingSub(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </button>
        }
      />

      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        {[
          { id: 'all', label: 'All Subscriptions' },
          { id: 'active', label: 'Active' },
          { id: 'in_trial', label: 'In Trial' },
          { id: 'pending', label: 'Pending PO' },
          { id: 'past_due', label: 'Past Due' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by ID, customer company, or plan name..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Billing Cycles</option>
            <option value="daily">Daily Cycle</option>
            <option value="weekly">Weekly Cycle</option>
            <option value="monthly">Monthly Cycle</option>
            <option value="yearly">Yearly Cycle</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Subscription ID</th>
                <th className="py-3 px-4">Customer &amp; Organization</th>
                <th className="py-3 px-4">Plan &amp; Licenses</th>
                <th className="py-3 px-4 text-right">Contract Amount</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">Renewal Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => onSelectSubscription(sub)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 group-hover:text-emerald-700">
                    {sub.subscriptionNumber || sub.id}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-emerald-800">
                      {sub.customerCompany}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {sub.customerName} · {sub.customerEmail}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      {sub.planName}
                    </div>
                    <div className="text-[11px] text-slate-400 capitalize font-normal">
                      {sub.billingCycle} cycle · {sub.quantity} seat
                      {sub.quantity > 1 ? 's' : ''}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(sub.totalAmount || sub.subtotal)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal capitalize">
                      /{sub.billingCycle}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] tabular-nums">
                    {formatDate(sub.startDate)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] tabular-nums">
                    {formatDate(sub.nextRenewalDate || sub.expiryDate)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={sub.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={(e) => handleGenerateInvoice(e, sub)}
                        title="Generate Invoicing Cycle"
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSub(sub);
                          setIsFormOpen(true);
                        }}
                        title="Edit Subscription"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSubId(sub.id);
                        }}
                        title="Delete Subscription"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Form Modal */}
      <SubscriptionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSub(null);
        }}
        onSubmit={handleSaveSubscription}
        customers={customers}
        plans={plans}
        products={products}
        initialSubscription={editingSub}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSubId}
        title="Delete Subscription Contract"
        message="Are you sure you want to permanently delete this subscription contract from the ledger?"
        confirmLabel="Delete Contract"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingSubId(null)}
      />
    </div>
  );
};
