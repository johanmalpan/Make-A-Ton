import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { MONTHLY_REVENUE_CHART_INR } from '../../data/mockData';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency';

type PeriodType = 'full-year' | 'ytd' | 'h2';

export const RevenueChart: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('full-year');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = React.useMemo(() => {
    if (period === 'ytd') {
      return MONTHLY_REVENUE_CHART_INR.slice(0, 10);
    }
    if (period === 'h2') {
      return MONTHLY_REVENUE_CHART_INR.slice(6, 12);
    }
    return MONTHLY_REVENUE_CHART_INR;
  }, [period]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.currentYear, d.previousYear))) * 1.15;
  const chartHeight = 240;

  const totalCurrentYear = data.reduce((acc, cur) => acc + cur.currentYear, 0);
  const totalPreviousYear = data.reduce((acc, cur) => acc + cur.previousYear, 0);
  const growthRate = (((totalCurrentYear - totalPreviousYear) / totalPreviousYear) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base text-slate-900">
              Revenue Overview
            </h2>
            <span className="text-xs text-slate-400 font-medium">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Current Year vs Previous Year (INR ₹)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{growthRate}% YoY Expansion</span>
            </div>
            <span className="text-xs text-slate-400">
              Avg MRR trajectory pacing +₹25k/mo
            </span>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setPeriod('full-year')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              period === 'full-year'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Year (2026)
          </button>
          <button
            onClick={() => setPeriod('ytd')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              period === 'ytd'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            YTD (Jan–Oct)
          </button>
          <button
            onClick={() => setPeriod('h2')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              period === 'h2'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            H2 Focus
          </button>
        </div>
      </div>

      {/* Metric Callouts Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-b border-slate-100 text-xs">
        <div>
          <div className="text-slate-400 font-medium">2026 Period Revenue</div>
          <div className="font-heading font-bold text-lg text-slate-900 tabular-nums">
            {formatCurrency(totalCurrentYear, false)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">2025 Prior Comparison</div>
          <div className="font-heading font-semibold text-lg text-slate-600 tabular-nums">
            {formatCurrency(totalPreviousYear, false)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Net Revenue Added</div>
          <div className="font-heading font-bold text-lg text-emerald-600 tabular-nums">
            +{formatCurrency(totalCurrentYear - totalPreviousYear, false)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Average Monthly Run-Rate</div>
          <div className="font-heading font-bold text-lg text-slate-900 tabular-nums">
            {formatCurrency(totalCurrentYear / data.length, false)}/mo
          </div>
        </div>
      </div>

      {/* SVG Bar Visualization */}
      <div className="pt-6 pb-2">
        <div className="relative h-[240px] w-full">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono">
            {[100, 75, 50, 25, 0].map((pct) => (
              <div key={pct} className="w-full flex items-center gap-2">
                <span className="w-14 text-right tabular-nums">
                  {formatCompactCurrency(Math.round((maxVal * pct) / 100))}
                </span>
                <div className="flex-1 border-b border-slate-100" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 pl-16 flex items-end justify-between gap-2 pt-2 pb-6">
            {data.map((item, idx) => {
              const curHeight = (item.currentYear / maxVal) * (chartHeight - 30);
              const prevHeight = (item.previousYear / maxVal) * (chartHeight - 30);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.month}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                >
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 bg-[#101D2D] text-white p-2.5 rounded-lg shadow-xl text-xs z-30 pointer-events-none w-48 -translate-x-1/2 left-1/2 animate-in fade-in-50 duration-100">
                      <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1 mb-1.5 flex items-center justify-between">
                        <span>{item.month} 2026</span>
                        {item.projected && (
                          <span className="text-[10px] text-amber-300 bg-amber-400/20 px-1 rounded">
                            Projected
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-emerald-400">
                          <span>2026:</span>
                          <span className="font-mono font-bold tabular-nums">
                            {formatCurrency(item.currentYear, false)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>2025:</span>
                          <span className="font-mono tabular-nums">
                            {formatCurrency(item.previousYear, false)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-700/60 font-medium">
                          <span>YoY Growth:</span>
                          <span className="text-emerald-400 font-mono">
                            +{(((item.currentYear - item.previousYear) / item.previousYear) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-1 w-full max-w-[36px] justify-center">
                    <div
                      style={{ height: `${prevHeight}px` }}
                      className="w-1/2 bg-slate-200 rounded-t-sm transition-all group-hover:bg-slate-300"
                    />
                    <div
                      style={{ height: `${curHeight}px` }}
                      className={`w-1/2 rounded-t-sm transition-all ${
                        item.projected
                          ? 'bg-[#15966B]/50 border-t-2 border-dashed border-[#15966B]'
                          : isHovered
                          ? 'bg-[#107553] shadow-sm'
                          : 'bg-[#15966B]'
                      }`}
                    />
                  </div>

                  <span className="absolute bottom-0 text-[11px] font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#15966B]" />
            <span className="font-medium text-slate-700">Current Year (2026)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-slate-200" />
            <span className="text-slate-600">Previous Year (2025)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-1 border-t-2 border-dashed border-[#15966B]" />
            <span>Projected (Nov–Dec)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Syncs with Brightloop Software Odoo Accounting Module
        </div>
      </div>
    </div>
  );
};
