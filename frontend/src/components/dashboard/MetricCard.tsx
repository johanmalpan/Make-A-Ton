import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  timeframe?: string;
  subtext?: string;
  icon: LucideIcon;
  accentColor?: string;
  bgColor?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  timeframe,
  subtext,
  icon: Icon,
  accentColor = 'text-emerald-600',
  bgColor = 'bg-emerald-50/70',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs transition-all flex flex-col justify-between ${
        onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer group' : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 leading-snug">
            {title}
          </span>
          <div className={`p-2 rounded-lg ${bgColor} ${accentColor} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          <span className="font-heading font-bold text-2xl text-slate-900 tracking-tight tabular-nums">
            {value}
          </span>
        </div>
      </div>

      {(change || subtext) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && (
            <span className="text-[11px] text-slate-500 truncate">
              {subtext}
            </span>
          )}
          {change && (
            <div
              className={`inline-flex items-center gap-0.5 font-semibold text-[11px] shrink-0 tabular-nums ml-auto ${
                isPositive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
              )}
              <span>{change}</span>
              {timeframe && <span className="text-slate-400 font-normal ml-1">({timeframe})</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
