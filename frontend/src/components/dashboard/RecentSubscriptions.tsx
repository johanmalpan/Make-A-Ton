import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Subscription } from '../../types/subscription';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

interface RecentSubscriptionsProps {
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
  onViewAll: () => void;
}

export const RecentSubscriptions: React.FC<RecentSubscriptionsProps> = ({
  subscriptions,
  onSelectSubscription,
  onViewAll,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base text-slate-900">
              Recent Subscriptions
            </h2>
            <span className="text-xs text-slate-400 font-medium">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Live Contract Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized with Odoo Enterprise Recurring Billing Schedules
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto py-1 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <span>View All Subscriptions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Subscription ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Plan & Terms</th>
              <th className="py-3 px-4 text-right">Amount (INR)</th>
              <th className="py-3 px-4">Start Date</th>
              <th className="py-3 px-4">Renewal Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {subscriptions.slice(0, 6).map((sub) => (
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
                    {sub.customerName}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800">{sub.planName}</div>
                  <div className="text-[11px] text-slate-400 capitalize font-normal">
                    {sub.billingCycle} billing · {sub.quantity} seat{sub.quantity > 1 ? 's' : ''}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubscription(sub);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
