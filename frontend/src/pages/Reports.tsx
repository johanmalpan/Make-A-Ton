import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { formatCurrency, formatCompactCurrency } from '../utils/formatCurrency';
import {
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [period, setPeriod] = useState<'30d' | 'quarter' | 'ytd'>('ytd');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Month,New MRR (INR),Expansion MRR (INR),Contraction MRR (INR),Churn MRR (INR),Net MRR (INR)\n' +
        'June 2026,65000,18000,4500,8000,70500\n' +
        'July 2026,72000,22000,3000,6500,84500\n' +
        'August 2026,81000,26000,5000,7200,94800\n' +
        'September 2026,89000,31000,4200,8900,106900\n' +
        'October 2026,98000,34500,3800,9200,119500\n';

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `subscriptiq_mrr_report_${period}_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 600);
  };

  const planBreakdown = [
    { name: 'Enterprise Annual (₹79,999/yr)', share: 58, mrr: 124500, active: 18, color: 'bg-emerald-600' },
    { name: 'Growth Tier Monthly (₹7,999/mo)', share: 24, mrr: 51993, active: 32, color: 'bg-[#101D2D]' },
    { name: 'High-Volume API Gateway (₹9,999/mo)', share: 13, mrr: 29997, active: 14, color: 'bg-blue-600' },
    { name: 'Starter Monthly (₹2,499/mo)', share: 5, mrr: 12495, active: 22, color: 'bg-slate-400' },
  ];

  const cycleDistribution = [
    { cycle: 'Yearly (Annual Contracts)', count: 24, percentage: 55, revenue: 1490000 },
    { cycle: 'Monthly (AutoPay Mandates)', count: 48, percentage: 38, revenue: 1024000 },
    { cycle: 'Weekly (Acceleration Sprints)', count: 8, percentage: 5, revenue: 135000 },
    { cycle: 'Daily (On-Demand Compute)', count: 3, percentage: 2, revenue: 54000 },
  ];

  const waterfallRows = [
    { component: 'Starting MRR (Oct 01)', amount: 198500, type: 'base' },
    { component: 'New Customer Subscriptions (+)', amount: 24500, type: 'positive' },
    { component: 'Expansion / Plan Upgrades (+)', amount: 12000, type: 'positive' },
    { component: 'Contraction / Module Removals (-)', amount: -3200, type: 'negative' },
    { component: 'Churned Cancellations (-)', amount: -4800, type: 'negative' },
    { component: 'Closing MRR (Oct 31)', amount: 227000, type: 'total' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Analytics & Reports"
        subtitle="Financial cohorts, Net Revenue Retention, MRR waterfall, and cycle distributions."
        action={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setPeriod('30d')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === '30d' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setPeriod('quarter')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === 'quarter' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Q3 2026
              </button>
              <button
                onClick={() => setPeriod('ytd')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === 'ytd' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                YTD 2026
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition-colors text-sm"
            >
              <Download className="w-4 h-4 text-slate-500" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        }
      />

      {/* Primary SaaS KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Revenue Retention (NRR)"
          value="114.2%"
          change="+3.4%"
          isPositive={true}
          timeframe="YoY growth"
          subtext="Expansion revenue outpaces churn"
          icon={ArrowUpRight}
        />
        <MetricCard
          title="Gross Monthly Churn"
          value="1.42%"
          change="-0.3%"
          isPositive={true}
          timeframe="vs Sep pace"
          subtext="Enterprise benchmark < 2.0%"
          icon={TrendingDown}
          accentColor="text-emerald-600"
        />
        <MetricCard
          title="Average Revenue Per Account"
          value={formatCurrency(18420, false)}
          change="+₹1,650"
          isPositive={true}
          timeframe="this quarter"
          subtext="Normalized monthly average"
          icon={Layers}
        />
        <MetricCard
          title="Customer Lifetime Value (LTV)"
          value={formatCurrency(348000, false)}
          change="3.8x"
          isPositive={true}
          timeframe="CAC payback"
          subtext="Gross margin adjusted"
          icon={ShieldCheck}
        />
      </div>

      {/* MRR Waterfall Ledger & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 font-heading">MRR Movement Waterfall</h3>
              <p className="text-xs text-slate-500 mt-0.5">Step-by-step net monthly recurring revenue progression</p>
            </div>
            <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Net Change: +{formatCompactCurrency(28500)}
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {waterfallRows.map((row, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-sm">
                <span className={`font-medium ${row.type === 'total' ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                  {row.component}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    row.type === 'positive'
                      ? 'text-emerald-600'
                      : row.type === 'negative'
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }`}
                >
                  {row.amount > 0 && row.type !== 'total' && row.type !== 'base' ? '+' : ''}
                  {formatCurrency(row.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Quick Ratio is currently <strong className="text-slate-800">4.56</strong> (New MRR + Expansion) ÷ (Churn + Contraction). Values above 4.0 represent top-decile capital efficiency.
            </span>
          </div>
        </div>

        {/* Revenue by Plan Share */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs p-5">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-heading">Revenue by Subscription Plan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Share of Monthly Recurring Revenue</p>
          </div>

          <div className="mt-5 space-y-4">
            {planBreakdown.map((plan, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800">{plan.name}</span>
                  <span className="font-mono font-semibold text-slate-900">{plan.share}% ({formatCurrency(plan.mrr)})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`${plan.color} h-full rounded-full`} style={{ width: `${plan.share}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  {plan.active} active subscriptions
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Normalized Run-Rate:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(218985)} / mo</span>
          </div>
        </div>
      </div>

      {/* Cycle Distribution Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-900 font-heading">Billing Frequency Breakdown</h3>
            <p className="text-xs text-slate-500">Breakdown of customer contracts across supported recurrence cadences</p>
          </div>
          <span className="text-xs text-slate-500">83 Total Contracts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs tracking-wider uppercase">
              <tr>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4 text-center">Active Contracts</th>
                <th className="py-3 px-4 text-center">Distribution</th>
                <th className="py-3 px-4 text-right">Total Annualized Value (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {cycleDistribution.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {row.cycle}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                    {row.count}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#15966B] h-full rounded-full"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-600">{row.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
