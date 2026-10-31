import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'in_trial'
  | 'pending'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'paid'
  | 'posted'
  | 'partial'
  | 'overdue'
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'succeeded'
  | 'failed'
  | 'processing'
  | 'refunded'
  | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  className = '',
}) => {
  const normalizedKey = (variant || status).toLowerCase().replace(/\s+/g, '_');

  const getStyle = (): { bg: string; text: string; border: string; dot: string; display: string } => {
    switch (normalizedKey) {
      case 'active':
      case 'paid':
      case 'accepted':
      case 'succeeded':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500',
          display: label || (status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')),
        };

      case 'in_trial':
      case 'processing':
      case 'sent':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          display: label || (status === 'in_trial' ? 'In Trial' : status.charAt(0).toUpperCase() + status.slice(1)),
        };

      case 'pending':
      case 'posted':
      case 'partial':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          display: label || (status === 'partial' ? 'Partially Paid' : status.charAt(0).toUpperCase() + status.slice(1)),
        };

      case 'past_due':
      case 'overdue':
      case 'failed':
      case 'declined':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          dot: 'bg-rose-500',
          display: label || (status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')),
        };

      case 'draft':
      case 'cancelled':
      case 'expired':
      case 'refunded':
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          border: 'border-slate-200',
          dot: 'bg-slate-400',
          display: label || (status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')),
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{style.display}</span>
    </span>
  );
};
