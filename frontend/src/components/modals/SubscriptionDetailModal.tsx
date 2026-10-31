import React from 'react';
import {
  X,
  Repeat,
  Calendar,
  Building,
  CreditCard,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Subscription, SubscriptionStatus } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

interface SubscriptionDetailModalProps {
  subscription: Subscription | null;
  onClose: () => void;
  onUpdateStatus: (subscriptionId: string, newStatus: SubscriptionStatus) => void;
  onViewCustomerInvoices: (companyName: string) => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  subscription,
  onClose,
  onUpdateStatus,
  onViewCustomerInvoices,
}) => {
  if (!subscription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-900 text-base">
              Subscription Contract
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              {subscription.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Top highlight card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#101D2D] to-[#182b40] text-white flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-300 font-medium">Contract Rate</div>
              <div className="font-heading font-bold text-2xl text-white tabular-nums mt-0.5">
                {formatCurrency(subscription.totalAmount)}
                <span className="text-xs font-normal text-slate-300">
                  /{subscription.billingCycle}
                </span>
              </div>
              <div className="text-xs text-emerald-300 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{subscription.autoRenew ? 'Auto-renewal enabled' : 'Manual renewal required'}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-medium">Status</span>
              <div className="mt-1">
                <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {subscription.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Plan Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Customer & Account
              </span>
              <div className="font-semibold text-slate-900 text-sm mt-1">
                {subscription.customerCompany}
              </div>
              <div className="text-slate-600 mt-0.5">{subscription.customerName}</div>
              <div className="text-slate-400">{subscription.customerEmail}</div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Plan & Tier
              </span>
              <div className="font-semibold text-slate-900 text-sm mt-1">
                {subscription.planName}
              </div>
              <div className="text-slate-600 mt-0.5">
                {subscription.quantity || 1} Unit(s) / Licenses
              </div>
              <div className="text-slate-400 capitalize">{subscription.billingCycle} billing</div>
            </div>
          </div>

          {/* Dates & Payment Details */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Contract Start Date</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {formatDate(subscription.startDate)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Next Scheduled Renewal</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatDate(subscription.nextRenewalDate)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Payment Instrument</span>
              <span className="font-medium text-slate-800">
                {subscription.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onViewCustomerInvoices(subscription.customerCompany);
              onClose();
            }}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Related Invoices</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2">
            {subscription.status === 'active' ? (
              <button
                onClick={() => onUpdateStatus(subscription.id, 'past_due')}
                className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Hold
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus(subscription.id, 'active')}
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Activate
              </button>
            )}

            {subscription.status !== 'cancelled' && (
              <button
                onClick={() => onUpdateStatus(subscription.id, 'cancelled')}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
