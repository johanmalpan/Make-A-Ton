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
import { normalizeToMRR, normalizeToARR } from '../utils/calculations';
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
  // Compute live metrics from data
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'in_trial');
  const totalMRR = activeSubs.reduce((sum, s) => sum + normalizeToMRR(s.totalAmount || s.subtotal, s.billingCycle), 0);
  const totalARR = totalMRR * 12;

  const outstandingInvoices = invoices.filter((i) => i.status !== 'paid');
  const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.outstandingBalance || i.totalAmount), 0);

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const collectedAmount = paidInvoices.reduce((sum, i) => sum + (i.paidAmount || i.totalAmount), 0);

  // Subscription Overview cohort breakdown
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const trialCount = subscriptions.filter((s) => s.status === 'in_trial').length;
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;
  const pastDueCount = subscriptions.filter((s) => s.status === 'past_due').length;
  const cancelledCount = subscriptions.filter((s) => s.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Welcome Heading Banner */}
      <PageHeader
        title="Good morning, Admin"
        subtitle="Here's what's happening with your subscriptions today."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>October 30, 2026 · Cycle W44</span>
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

      {/* Six Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(totalMRR, false)}
          change="+8.4%"
          isPositive={true}
          timeframe="vs last mo"
          subtext="Net normalized MRR"
          icon={TrendingUp}
          onClick={() => onNavigate('reports')}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={formatCurrency(totalARR, false)}
          change="+14.2%"
          isPositive={true}
          timeframe="YoY pace"
          subtext="Forward trajectory"
          icon={Banknote}
          onClick={() => onNavigate('reports')}
        />
        <MetricCard
          title="Active Subscriptions"
          value={`${activeSubs.length}`}
          change="+19"
          isPositive={true}
          timeframe="this cycle"
          subtext={`${activeCount} paid · ${trialCount} trials`}
          icon={Repeat}
          accentColor="text-blue-600"
          bgColor="bg-blue-50/70"
          onClick={() => onNavigate('subscriptions')}
        />
        <MetricCard
          title="Total Customers"
          value={`${customers.length}`}
          change="+12"
          isPositive={true}
          timeframe="new clients"
          subtext="1.24 subs / account"
          icon={Users}
          accentColor="text-purple-600"
          bgColor="bg-purple-50/70"
          onClick={() => onNavigate('customers')}
        />
        <MetricCard
          title="Outstanding Invoices"
          value={formatCurrency(outstandingAmount, false)}
          change={`${outstandingInvoices.length} inv`}
          isPositive={false}
          timeframe="unsettled"
          subtext="Receivables balance"
          icon={AlertCircle}
          accentColor="text-amber-600"
          bgColor="bg-amber-50/70"
          onClick={() => onNavigate('invoices')}
        />
        <MetricCard
          title="Revenue Collected"
          value={formatCurrency(collectedAmount, false)}
          change="94.8%"
          isPositive={true}
          timeframe="efficiency"
          subtext="Cleared via payment gateway"
          icon={CreditCard}
          onClick={() => onNavigate('payments')}
        />
      </div>

      {/* Section A: Revenue Overview Chart */}
      <RevenueChart />

      {/* Section B: Subscription Lifecycle Overview */}
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

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Active Subscriptions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {activeCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({subscriptions.length > 0 ? Math.round((activeCount / subscriptions.length) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Generating recurring revenue</p>
          </div>

          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Pending Subscriptions</span>
              <Clock className="w-4 h-4 text-blue-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {pendingCount + trialCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({trialCount} trials, {pendingCount} POs)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Awaiting activation or trial conversion</p>
          </div>

          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Renewals Due</span>
              <CalendarClock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {pastDueCount > 0 ? pastDueCount : 3}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Next 15 Days)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Scheduled for automated payment charge</p>
          </div>

          <div
            onClick={() => onNavigate('subscriptions')}
            className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 cursor-pointer hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Cancelled / Closed</span>
              <XCircle className="w-4 h-4 text-rose-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-heading font-bold text-2xl text-slate-900 tabular-nums">
                {cancelledCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (1.6% churn)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">Low churn rate below SaaS industry benchmark</p>
          </div>
        </div>
      </div>

      {/* Section C: Recent Subscriptions Table */}
      <RecentSubscriptions
        subscriptions={subscriptions}
        onSelectSubscription={onSelectSubscription}
        onViewAll={() => onNavigate('subscriptions')}
      />

      {/* Section D: Recent Invoices Table */}
      <RecentInvoices
        invoices={invoices}
        onSelectInvoice={onSelectInvoice}
        onViewAll={() => onNavigate('invoices')}
        onSendReminder={onSendInvoiceReminder}
      />
    </div>
  );
};
