
import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { Invoice } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency';

type PeriodType = 'full-year' | 'ytd' | 'h2';

interface RevenueChartProps {
  invoices: Invoice[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ invoices }) => {
  const [period, setPeriod] = useState<PeriodType>('full-year');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const revenue = invoices
        .filter((invoice) => {
          const date = new Date(invoice.issueDate + 'T00:00:00');

          return (
            invoice.paidAmount > 0 &&
            !Number.isNaN(date.getTime()) &&
            date.getFullYear() === currentYear &&
            date.getMonth() === monthIndex
          );
        })
        .reduce((total, invoice) => total + invoice.paidAmount, 0);

      return {
        month: new Date(currentYear, monthIndex).toLocaleString('en-IN', {
          month: 'short',
        }),
        revenue,
      };
    });
  }, [invoices, currentYear]);

  const data = useMemo(() => {
    if (period === 'ytd') {
      return monthlyData.slice(0, new Date().getMonth() + 1);
    }

    if (period === 'h2') {
      return monthlyData.slice(6, 12);
    }

    return monthlyData;
  }, [period, monthlyData]);

  const totalRevenue = data.reduce(
    (total, item) => total + item.revenue,
    0
  );

  const maxVal = Math.max(...data.map((item) => item.revenue), 1) * 1.15;
  const chartHeight = 240;

  const highestMonth = data.reduce(
    (highest, item) =>
      item.revenue > highest.revenue ? item : highest,
    { month: '-', revenue: 0 }
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-base text-slate-900">
              Revenue Overview
            </h2>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Paid Invoice Revenue (INR ₹)
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Based on recorded payments</span>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setPeriod('full-year')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              period === 'full-year'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Year
          </button>

          <button
            onClick={() => setPeriod('ytd')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              period === 'ytd'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Year to Date
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

      {/* Revenue Metrics */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-100 text-xs">
        <div>
          <div className="text-slate-400 font-medium">
            Total Paid Invoice Amount
          </div>
          <div className="font-heading font-bold text-lg text-slate-900 tabular-nums">
            {formatCurrency(totalRevenue, false)}
          </div>
        </div>

        <div>
          <div className="text-slate-400 font-medium">
            Highest Revenue Month
          </div>
          <div className="font-heading font-bold text-lg text-slate-900">
            {highestMonth.month}
          </div>
          <div className="text-xs text-slate-500">
            {formatCurrency(highestMonth.revenue, false)}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="pt-6 pb-2">
        <div className="relative h-[240px] w-full">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono">
            {[100, 75, 50, 25, 0].map((pct) => (
              <div key={pct} className="w-full flex items-center gap-2">
                <span className="w-14 text-right tabular-nums">
                  {formatCompactCurrency(
                    Math.round((maxVal * pct) / 100)
                  )}
                </span>
                <div className="flex-1 border-b border-slate-100" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 pl-16 flex items-end justify-between gap-2 pt-2 pb-6">
            {data.map((item, idx) => {
              const barHeight =
                (item.revenue / maxVal) * (chartHeight - 30);

              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.month}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
                >
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 bg-[#101D2D] text-white p-2.5 rounded-lg shadow-xl text-xs z-30 pointer-events-none w-44 -translate-x-1/2 left-1/2">
                      <div className="font-semibold text-slate-200 border-b border-slate-700/60 pb-1 mb-1.5">
                        {item.month} {currentYear}
                      </div>

                      <div className="flex justify-between items-center text-emerald-400">
                        <span>Revenue:</span>
                        <span className="font-mono font-bold tabular-nums">
                          {formatCurrency(item.revenue, false)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end w-full max-w-[36px] justify-center h-full">
                    <div
                      style={{ height: `${barHeight}px` }}
                      className={`w-full rounded-t-sm transition-all ${
                        isHovered
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
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-[#15966B]" />
          <span className="font-medium text-slate-700">
            Paid invoice amount
          </span>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          Based on available invoice records
        </div>
      </div>

      {totalRevenue === 0 && (
        <p className="text-center text-xs text-slate-400 mt-3">
          No paid invoice revenue recorded for this period.
        </p>
      )}
    </div>
  );
};
