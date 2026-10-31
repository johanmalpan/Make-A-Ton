import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Repeat, 
  AlertTriangle, 
  Users, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  CreditCard,
  Plus,
  Download,
  MoreVertical,
  Radio,
  ChevronDown,
  ShieldCheck,
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { api } from '../../services/api';

interface DashboardViewProps {
  onOpenBillingModal: () => void;
  onOpenQuotationModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenCustomerModal: () => void;
  onSelectInvoice: (invoiceId: string) => void;
  setActiveSection: (sec: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenBillingModal,
  onOpenQuotationModal,
  onOpenSubscriptionModal,
  onOpenCustomerModal,
  onSelectInvoice,
  setActiveSection
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrajectoryTab, setActiveTrajectoryTab] = useState<'mrr' | 'net'>('mrr');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getFinancialReport();
      setData(res);
    } catch (err: any) {
      console.warn('Dashboard financial report notice:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[450px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#944a27] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Calculating real-time subscription financial metrics...</p>
        </div>
      </div>
    );
  }

  // Live database calculations with zero-record empty-state support
  const totalActive = data.activeSubscriptionsCount || 0;
  const mrrDisplay = data.mrr || 0;
  const arrDisplay = data.arr || 0;
  const pendingDisplay = data.invoicing?.totalOutstanding || 0;
  const collectedDisplay = data.invoicing?.totalCollected || 0;
  const totalCustomers = data.totalCustomers || 0;
  const paymentsCount = data.paymentsCount || 0;
  const openInvoicesCount = data.invoicing?.open_invoices_count ?? (data.overdueCount || 0);

  // Lifecycle stage breakdown for donut chart from real database
  const activeCount = data.activeSubscriptionsCount || 0;
  const pausedCount = data.pausedSubscriptionsCount || 0;
  const pendingCount = data.pendingSubscriptionsCount || 0;
  const cancelledCount = data.cancelledSubscriptionsCount || 0;
  const totalSeats = activeCount + pausedCount + pendingCount + cancelledCount;

  const activePct = totalSeats > 0 ? ((activeCount / totalSeats) * 100).toFixed(1) : '0.0';
  const pausedPct = totalSeats > 0 ? ((pausedCount / totalSeats) * 100).toFixed(1) : '0.0';
  const pendingPct = totalSeats > 0 ? ((pendingCount / totalSeats) * 100).toFixed(1) : '0.0';
  const cancelledPct = totalSeats > 0 ? ((cancelledCount / totalSeats) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5 bg-[#f8fafc] text-slate-800">
      
      {/* 1. Header Banner & Quick Actions from Screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Good morning, Admin.
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Here's what's happening with your subscription business today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date range filter pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span><strong className="font-semibold text-slate-900">Reporting Window:</strong> Real-time Ledger</span>
          </div>

          {/* Export Summary button */}
          <button 
            onClick={() => {
              const exportBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(exportBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `subscriptiq-financial-summary-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Summary</span>
          </button>

          {/* Create Subscription Primary Terracotta Button */}
          <button
            onClick={onOpenSubscriptionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Subscription</span>
          </button>

          {/* Secondary Quick Action: Quotation */}
          <button
            onClick={onOpenQuotationModal}
            title="Create Quotation"
            className="hidden xl:flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-semibold shadow-2xs transition-all"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: ACTIVE SUBSCRIPTIONS */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Active Subscriptions
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
              totalActive > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200/60' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {totalActive > 0 ? `${totalActive} active` : '0 active'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {totalActive.toLocaleString()}
            </span>
            
            {/* Sparkline curve */}
            <svg className={`w-14 h-5 stroke-current fill-none ${totalActive > 0 ? 'text-teal-600' : 'text-slate-300'}`} viewBox="0 0 60 20">
              <path d="M2 14 Q 15 15, 25 10 T 45 6 T 58 4" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {totalCustomers} {totalCustomers === 1 ? 'customer registered' : 'customers registered'}
          </p>
        </div>

        {/* Card 2: MONTHLY REVENUE */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Monthly Revenue
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
              mrrDisplay > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200/60' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {mrrDisplay > 0 ? 'Live MRR' : '$0.00'}
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ${mrrDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {mrrDisplay > 0 ? 'Current normalized MRR pace' : 'No active recurring revenue'}
          </p>
        </div>

        {/* Card 3: ANNUAL RECURRING */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Annual Recurring
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
              arrDisplay > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200/60' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {arrDisplay > 0 ? 'ARR' : '0.0 ARR'}
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ${arrDisplay >= 1000000 
                ? (arrDisplay / 1000000).toFixed(2) + 'M' 
                : arrDisplay >= 1000 
                ? (arrDisplay / 1000).toFixed(1) + 'k' 
                : arrDisplay.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500">ARR</span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            ${((mrrDisplay * 12) / 1000).toFixed(1)}k annualized run-rate
          </p>
        </div>

        {/* Card 4: PENDING RECEIVABLES */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Receivables
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
              openInvoicesCount > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200/60' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {openInvoicesCount} open
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ${pendingDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {openInvoicesCount > 0 ? `${openInvoicesCount} invoices awaiting payment` : 'All invoices fully settled'}
          </p>
        </div>

        {/* Card 5: PAYMENTS RECEIVED */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Payments Received
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
              paymentsCount > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200/60' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {paymentsCount} paid
            </span>
          </div>

          <div className="mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ${collectedDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {paymentsCount} {paymentsCount === 1 ? 'settlement cleared' : 'settlements cleared'}
          </p>
        </div>

      </div>

      {/* 3. Middle Row: Revenue Trajectory + Subscriber Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Revenue Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-sans">Revenue Trajectory</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Recurring Volume
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Performance analysis comparing monthly recurring billed volume
            </p>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setActiveTrajectoryTab('mrr')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTrajectoryTab === 'mrr'
                    ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly Recurring
              </button>
              <button
                onClick={() => setActiveTrajectoryTab('net')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTrajectoryTab === 'net'
                    ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Net Volume
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization or Empty State */}
          {data.monthlyRevenue && data.monthlyRevenue.length > 0 && data.monthlyRevenue.some((m: any) => m.total > 0 || m.collected > 0) ? (
            <div className="mt-6 relative">
              {/* Dynamic Bars container */}
              <div className="h-52 flex items-end justify-between gap-4 px-2 pt-6 pb-2 border-b border-slate-100">
                {(() => {
                  const maxVal = Math.max(...data.monthlyRevenue.map((m: any) => m.total || 0), 100);
                  return data.monthlyRevenue.map((item: any, idx: number) => {
                    const totalHeight = Math.min(100, (item.total / maxVal) * 100);
                    const collectedHeight = Math.min(totalHeight, (item.collected / maxVal) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="w-10 relative flex flex-col items-center justify-end h-full">
                          {/* Total Invoiced Bar */}
                          <div 
                            style={{ height: `${totalHeight}%` }}
                            className="w-full bg-[#dbeafe] rounded-t-sm transition-all group-hover:bg-[#bfdbfe]"
                            title={`Invoiced: $${item.total.toFixed(2)}`}
                          />
                          {/* Collected Bar */}
                          <div 
                            style={{ height: `${collectedHeight}%` }}
                            className="w-full bg-[#944a27] rounded-b-xs transition-all group-hover:bg-[#833f20] absolute bottom-0"
                            title={`Collected: $${item.collected.toFixed(2)}`}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 mt-2">{item.ym || item.month_num}</span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#944a27]" />
                    <span className="text-slate-600 font-medium">Collected Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#dbeafe]" />
                    <span className="text-slate-600 font-medium">Invoiced Total</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                  MRR Pace: <span className="text-emerald-700 font-bold">${mrrDisplay.toFixed(2)}/mo</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-6 py-12 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400 mb-2.5">
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-800">No Billing Data Recorded</p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1 px-4">
                Monthly recurring revenue and collected volume will appear here once subscriptions generate invoices.
              </p>
              <button
                onClick={onOpenSubscriptionModal}
                className="mt-3.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#944a27] border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all"
              >
                Create First Subscription
              </button>
            </div>
          )}

        </div>

        {/* Right: Subscriber Health Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Subscriber Health</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Portfolio allocation across live lifecycle stages
                </p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Donut Chart and Legend */}
          <div className="py-4 flex items-center justify-between gap-4">
            
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="11" fill="none" />
                
                {totalSeats > 0 ? (
                  <>
                    {/* Active Segment (Teal) */}
                    {activeCount > 0 && (
                      <circle 
                        cx="50" cy="50" r="38" 
                        stroke="#0f766e" 
                        strokeWidth="11" 
                        fill="none" 
                        strokeDasharray="238.76" 
                        strokeDashoffset={238.76 * (1 - (activeCount / totalSeats))} 
                        strokeLinecap="round"
                      />
                    )}

                    {/* Paused Segment (Amber) */}
                    {pausedCount > 0 && (
                      <circle 
                        cx="50" cy="50" r="38" 
                        stroke="#d97706" 
                        strokeWidth="11" 
                        fill="none" 
                        strokeDasharray="238.76" 
                        strokeDashoffset={238.76 * (1 - (pausedCount / totalSeats))} 
                        transform={`rotate(${((activeCount / totalSeats) * 360).toFixed(0)} 50 50)`}
                      />
                    )}

                    {/* Cancelled Segment (Terracotta/Red) */}
                    {cancelledCount > 0 && (
                      <circle 
                        cx="50" cy="50" r="38" 
                        stroke="#be123c" 
                        strokeWidth="11" 
                        fill="none" 
                        strokeDasharray="238.76" 
                        strokeDashoffset={238.76 * (1 - (cancelledCount / totalSeats))} 
                        transform={`rotate(${(((activeCount + pausedCount) / totalSeats) * 360).toFixed(0)} 50 50)`}
                      />
                    )}
                  </>
                ) : (
                  <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="11" fill="none" />
                )}
              </svg>

              {/* Center Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
                <span className="text-lg font-black text-slate-900 tracking-tight font-sans">
                  {totalSeats.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                  Total Seats
                </span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
                  <span className="text-slate-600 font-medium">Active</span>
                </div>
                <div className="font-semibold text-slate-900">
                  {activeCount.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">({activePct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d97706]" />
                  <span className="text-slate-600 font-medium">Paused</span>
                </div>
                <div className="font-semibold text-slate-900">
                  {pausedCount.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">({pausedPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                  <span className="text-slate-600 font-medium">Pending</span>
                </div>
                <div className="font-semibold text-slate-900">
                  {pendingCount.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">({pendingPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#be123c]" />
                  <span className="text-slate-600 font-medium">Cancelled</span>
                </div>
                <div className="font-semibold text-slate-900">
                  {cancelledCount.toLocaleString()} <span className="text-[11px] text-slate-400 font-normal">({cancelledPct}%)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Card: Net Retention (NRR) Banner */}
          <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-950 font-semibold">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Net Retention (NRR)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sky-900 text-sm">
                {data.churnRate > 0 ? `${(100 - data.churnRate).toFixed(1)}%` : '100.0%'}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                Live Retention
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Bottom Row: Scheduled Dunning & Cycles + Real-Time Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Scheduled Dunning & Cycles (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">Scheduled Dunning & Cycles</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated debits scheduled over upcoming cycles
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Next Cycle: Scheduled
              </span>
            </div>
          </div>

          {/* Highlight Card: Next 24h Execution */}
          <div className="p-3.5 rounded-xl bg-[#fdf8f4] border border-[#f5e6db] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#944a27] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Next 24h Execution</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                  {data.queuedNext24h && data.queuedNext24h.count > 0 ? (
                    `$${Number(data.queuedNext24h.amount).toFixed(2)} queued across ${data.queuedNext24h.count} ${data.queuedNext24h.count === 1 ? 'account' : 'accounts'}`
                  ) : (
                    '0 renewals queued in the next 24 hours'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBillingModal}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-all shrink-0"
            >
              Inspect Queue
            </button>
          </div>

          {/* Automated Retry Pipeline Section */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Automated Retry Pipeline
            </div>

            {data.aging?.totalOverdue > 0 ? (
              <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/60 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-bold text-slate-900">Overdue Portfolios</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5 font-medium">
                    ${data.aging.totalOverdue.toFixed(2)} overdue • Smart Dunning Active
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={onOpenBillingModal}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#944a27] bg-[#944a27]/10 hover:bg-[#944a27]/20 rounded-md transition-all"
                  >
                    Retry Cycle
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All accounts in good standing. No overdue dunning retries pending.</span>
              </div>
            )}

            {/* Overdue aging summary row from real database */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Overdue aging across portfolios:</span>
              <span className={`font-semibold ${data.aging?.totalOverdue > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                ${(data.aging?.totalOverdue || 0).toFixed(2)} total overdue
              </span>
            </div>
          </div>

        </div>

        {/* Right: Real-Time Event Stream (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Real-Time Event Stream</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Live audit ledger of customer billing operations
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Live</span>
            </div>
          </div>

          {/* Audit events stream from real database */}
          <div className="space-y-2.5 max-h-68 overflow-y-auto pr-1 divide-y divide-slate-100">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 5).map((log: any, idx: number) => {
                let detailsObj: any = {};
                try {
                  detailsObj = typeof log.details_json === 'string' ? JSON.parse(log.details_json) : log.details_json || {};
                } catch (e) {
                  detailsObj = {};
                }
                const actionLabel = (log.action || 'ACTIVITY').replace(/_/g, ' ');
                const isPositive = log.action.includes('PAYMENT') || log.action.includes('ACTIVATE') || log.action.includes('CONFIRM');
                const isNegative = log.action.includes('CANCEL') || log.action.includes('VOID') || log.action.includes('REVERSE');
                
                return (
                  <div key={log.id || idx} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                        isPositive 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : isNegative 
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      }`}>
                        {isPositive ? <Check className="w-3.5 h-3.5" /> : isNegative ? <AlertTriangle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate capitalize">{actionLabel.toLowerCase()}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {log.user_name || 'System'} • {detailsObj.invoiceNumber || detailsObj.subscriptionNumber || detailsObj.reason || log.entity_type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                        isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isNegative ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {log.entity_type || 'SYSTEM'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No Operations Recorded Yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                  Live billing events, subscription changes, and payment records will appear here as they occur.
                </p>
              </div>
            )}
          </div>

          {/* Footer link to full audit ledger */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveSection('reports')}
              className="text-xs font-semibold text-[#944a27] hover:underline flex items-center gap-1"
            >
              <span>View complete audit trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
