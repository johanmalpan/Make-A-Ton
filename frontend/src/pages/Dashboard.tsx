
import React from 'react';
import {
  TrendingUp,
  Banknote,
  Repeat,
  Users,
  AlertCircle,
  CreditCard,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  CalendarClock,
  XCircle,
  ArrowRight,
} from 'lucide-react';

import { MetricCard } from '../components/dashboard/MetricCard';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { RecentSubscriptions } from '../components/dashboard/RecentSubscriptions';
import { RecentInvoices } from '../components/dashboard/RecentInvoices';
import { PageHeader } from '../components/layout/PageHeader';

import { Subscription } from '../types/subscription';
import { Invoice } from '../types/invoice';
import { Customer } from '../types/customer';

import { formatCurrency } from '../utils/formatCurrency';
import { normalizeToMRR } from '../utils/calculations';
import { NavigationPath } from '../types';

interface DashboardProps {
  subscriptions: Subscription[];
  invoices: Invoice[];
  customers: Customer[];
  onNavigate: (path: NavigationPath) => void;
  onSelectSubscription: (sub: Subscription) => void;
  onSelectInvoice: (inv: Invoice) => void;
  onOpenNewSubscription: () => void;
  onSendInvoiceReminder: (inv: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  subscriptions,
  invoices,
  customers,
  onNavigate,
  onSelectSubscription,
  onSelectInvoice,
  onOpenNewSubscription,
  onSendInvoiceReminder,
}) => {
  // Subscription revenue metrics
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'in_trial'
  );

  const totalMRR = activeSubs.reduce(
    (sum, s) =>
      sum +
      normalizeToMRR(s.totalAmount || s.subtotal, s.billingCycle),
    0
  );

  const totalARR = totalMRR * 12;

  // Outstanding invoice calculations
  const outstandingInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== 'paid' &&
      invoice.status !== 'cancelled' &&
      invoice.status !== 'draft' &&
      invoice.outstandingBalance > 0
  );

  const outstandingAmount = outstandingInvoices.reduce(
    (sum, invoice) => sum + invoice.outstandingBalance,
    0
  );

  // Collected amount from invoice payment records
  const collectedAmount = invoices.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0
  );

  const paidInvoicesCount = invoices.filter(
    (invoice) => invoice.paidAmount > 0
  ).length;

  // Subscription status breakdown
  const activeCount = subscriptions.filter(
    (s) => s.status === 'active'
  ).length;

  const trialCount = subscriptions.filter(
    (s) => s.status === 'in_trial'
  ).length;

  const pendingCount = subscriptions.filter(
    (s) => s.status === 'pending'
  ).length;

  const cancelledCount = subscriptions.filter(
    (s) => s.status === 'cancelled'
  ).length;

  // Renewals due within the next 15 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fifteenDaysLater = new Date(today);
  fifteenDaysLater.setDate(today.getDate() + 15);

  const renewalsDue = subscriptions.filter((subscription) => {
    if (
      subscription.status !== 'active' &&
      subscription.status !== 'in_trial'
    ) {
      return false;
    }

    if (!subscription.nextRenewalDate) return false;

    const renewalDate = new Date(
      `${subscription.nextRenewalDate}T00:00:00`
    );

    return (
      !Number.isNaN(renewalDate.getTime()) &&
      renewalDate >= today &&
      renewalDate <= fifteenDaysLater
    );
  }).length;

  const formattedDate = today.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Welcome Heading */}
      <PageHeader
        title="Good morning, Admin"
        subtitle="Here's what's happening with your subscriptions today."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>

            <button
              onClick={onOpenNewSubscription}
              className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Subscription</span>
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(totalMRR, false)}
          change="Live"
          isPositive={true}
          timeframe="current"
          subtext="Normalized monthly revenue"
          icon={TrendingUp}
          onClick={() => onNavigate('reports')}
        />

        <MetricCard
          title="Annual Recurring Revenue"
          value={formatCurrency(totalARR, false)}
          change="Annualized"
          isPositive={true}
          timeframe="current"
          subtext="Based on current MRR"
          icon={Banknote}
          onClick={() => onNavigate('reports')}
        />

        <MetricCard
          title="Active Subscriptions"
          value={`${activeSubs.length}`}
          change="Current"
          isPositive={true}
          timeframe="live count"
          subtext={`${activeCount} active · ${trialCount} trials`}
          icon={Repeat}
          accentColor="text-blue-600"
          bgColor="bg-blue-50/70"
          onClick={() => onNavigate('subscriptions')}
        />

        <MetricCard
          title="Total Customers"
          value={`${customers.length}`}
          change="Registered"
          isPositive={true}
          timeframe="current"
          subtext="Total customer accounts"
          icon={Users}
          accentColor="text-purple-600"
          bgColor="bg-purple-50/70"
          onClick={() => onNavigate('customers')}
        />

        <MetricCard
          title="Outstanding Invoices"
          value={formatCurrency(outstandingAmount, false)}
          change={`${outstandingInvoices.length} invoices`}
          isPositive={false}
          timeframe="unpaid balance"
          subtext="Outstanding receivables"
          icon={AlertCircle}
          accentColor="text-amber-600"
          bgColor="bg-amber-50/70"
          onClick={() => onNavigate('invoices')}
        />

        <MetricCard
          title="Revenue Collected"
          value={formatCurrency(collectedAmount, false)}
          change={`${paidInvoicesCount} invoices`}
          isPositive={true}
          timeframe="with payments"
          subtext="Amount received against invoices"
          icon={CreditCard}
          onClick={() => onNavigate('payments')}
        />
      </div>

      {/* Section A: Revenue Overview */}
      <RevenueChart invoices={invoices} />

      {/* Section B: Subscription Overview */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Subscription Overview
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Live portfolio status breakdown across all Brightloop Software products
            </p>
          </div>

          <button
            onClick={() => onNavigate('subscriptions')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto py-1 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <span>View All Subscriptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Active */}
          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Active Subscriptions
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {activeCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({subscriptions.length > 0
                  ? Math.round((activeCount / subscriptions.length) * 100)
                  : 0}%)
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mt-1">
              Currently active subscriptions
            </p>
          </div>

          {/* Pending and Trial */}
          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Pending Subscriptions
              </span>
              <Clock className="w-4 h-4 text-blue-700" />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {pendingCount + trialCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({trialCount} trials, {pendingCount} pending)
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mt-1">
              Awaiting activation or trial conversion
            </p>
          </div>

          {/* Renewals Due */}
          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Renewals Due
              </span>
              <CalendarClock className="w-4 h-4 text-amber-700" />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {renewalsDue}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Next 15 days)
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mt-1">
              Upcoming subscription renewals
            </p>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Cancelled / Closed
              </span>
              <XCircle className="w-4 h-4 text-rose-700" />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {cancelledCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                cancelled
              </span>
            </div>

            <p className="text-[11px] text-slate-600 mt-1">
              Total cancelled subscriptions
            </p>
          </div>
        </div>
      </div>

      {/* Section C: Recent Subscriptions */}
      <RecentSubscriptions
        subscriptions={subscriptions}
        onSelectSubscription={onSelectSubscription}
        onViewAll={() => onNavigate('subscriptions')}
      />

      {/* Section D: Recent Invoices */}
      <RecentInvoices
        invoices={invoices}
        onSelectInvoice={onSelectInvoice}
        onViewAll={() => onNavigate('invoices')}
        onSendReminder={onSendInvoiceReminder}
      />
    </div>
  );
};
