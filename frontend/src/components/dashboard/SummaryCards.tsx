import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Repeat,
  Users,
  AlertCircle,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface SummaryCardsProps {
  onCardClick?: (metricKey: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ onCardClick }) => {
  const cards = [
    {
      key: 'mrr',
      title: 'Monthly Recurring Revenue',
      acronym: 'MRR',
      value: '$84,250',
      change: '+8.4%',
      isPositive: true,
      timeframe: 'vs last month',
      subtext: '+$6,520 net new MRR',
      icon: TrendingUp,
      accentColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70',
    },
    {
      key: 'arr',
      title: 'Annual Recurring Revenue',
      acronym: 'ARR',
      value: '$1,011,000',
      change: '+14.2%',
      isPositive: true,
      timeframe: 'YoY trajectory',
      subtext: 'Runway pace: $1.15M target',
      icon: Banknote,
      accentColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70',
    },
    {
      key: 'active-subs',
      title: 'Active Subscriptions',
      acronym: 'Active',
      value: '642',
      change: '+19',
      isPositive: true,
      timeframe: 'net this cycle',
      subtext: '592 paid · 50 in active trials',
      icon: Repeat,
      accentColor: 'text-blue-600',
      bgColor: 'bg-blue-50/70',
    },
    {
      key: 'customers',
      title: 'Total Customers',
      acronym: 'Clients',
      value: '518',
      change: '+44',
      isPositive: true,
      timeframe: 'new this month',
      subtext: '1.24 subs per customer',
      icon: Users,
      accentColor: 'text-purple-600',
      bgColor: 'bg-purple-50/70',
    },
    {
      key: 'outstanding',
      title: 'Outstanding Invoices',
      acronym: 'Receivable',
      value: '$18,400',
      change: '14 invoices',
      isPositive: false,
      timeframe: '3 require dunning',
      subtext: '92% collection recovery rate',
      icon: AlertCircle,
      accentColor: 'text-amber-600',
      bgColor: 'bg-amber-50/70',
    },
    {
      key: 'collected',
      title: 'Revenue Collected This Month',
      acronym: 'Cashflow',
      value: '$79,850',
      change: '94.8%',
      isPositive: true,
      timeframe: 'collection rate',
      subtext: '$4,400 pending gateway deposit',
      icon: CreditCard,
      accentColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            onClick={() => onCardClick?.(card.key)}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              {/* Header: Title and Icon */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 leading-snug">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.accentColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Metric Value */}
              <div className="mt-2.5">
                <span className="font-heading font-bold text-2xl text-slate-900 tracking-tight tabular-nums">
                  {card.value}
                </span>
              </div>
            </div>

            {/* Subtext and Delta Indicator */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 truncate">
                {card.subtext}
              </span>
              <div
                className={`inline-flex items-center gap-0.5 font-semibold text-[11px] shrink-0 tabular-nums ${
                  card.isPositive ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {card.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                )}
                <span>{card.change}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
