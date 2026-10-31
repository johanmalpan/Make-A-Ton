
import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { formatCurrency, formatCompactCurrency } from '../utils/formatCurrency';
import type { Invoice, Subscription, Payment } from '../types';
import {
  Download,
  Calendar,
  TrendingUp,
  CreditCard,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface ReportsProps {
  invoices: Invoice[];
  subscriptions: Subscription[];
  customers: { id: string }[];
  payments: Payment[];
}

type Period = '30d' | 'quarter' | 'ytd';

export const Reports: React.FC<ReportsProps> = ({
  invoices,
  subscriptions,
  customers,
  payments,
}) => {
  const [period, setPeriod] = useState<Period>('ytd');

  const now = new Date();

  const startDate = useMemo(() => {
    const date = new Date();

    if (period === '30d') {
      date.setDate(date.getDate() - 30);
    } else if (period === 'quarter') {
      const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
      date.setMonth(quarterStartMonth, 1);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }

    return date;
  }, [period]);

  const successfulPayments = payments.filter(
    payment => payment.status === 'succeeded'
  );

  const filteredPayments = successfulPayments.filter(payment => {
    const paymentDate = new Date(payment.paymentDate);
    return !Number.isNaN(paymentDate.getTime()) &&
      paymentDate >= startDate &&
      paymentDate <= now;
  });

  const collectedRevenue = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const outstandingInvoices = invoices.filter(invoice =>
    invoice.outstandingBalance > 0 &&
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    invoice.status !== 'draft'
  );

  const overdueInvoices = invoices.filter(invoice =>
    invoice.outstandingBalance > 0 &&
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    invoice.status !== 'draft' &&
    (
      invoice.status === 'overdue' ||
      new Date(invoice.dueDate) < now
    )
  );

  const outstandingAmount = outstandingInvoices.reduce(
    (sum, invoice) => sum + invoice.outstandingBalance,
    0
  );

  const overdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + invoice.outstandingBalance,
    0
  );

  const activeSubscriptions = subscriptions.filter(
    subscription =>
      subscription.status === 'active' ||
      subscription.status === 'in_trial'
  );

  const subscriptionRevenue = activeSubscriptions.reduce(
    (sum, subscription) => sum + subscription.totalAmount,
    0
  );

  const uniqueCustomers = new Set([
    ...subscriptions.map(subscription => subscription.customerId),
    ...invoices.map(invoice => invoice.customerId),
  ]);

  const monthlyRevenue = useMemo(() => {
    const months: { label: string; amount: number }[] = [];

    const start = new Date(startDate);
    start.setDate(1);

    const end = new Date(now);
    end.setDate(1);

    const cursor = new Date(start);

    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();

      const amount = filteredPayments
        .filter(payment => {
          const date = new Date(payment.paymentDate);
          return date.getFullYear() === year &&
            date.getMonth() === month;
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

      months.push({
        label: cursor.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        }),
        amount,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }, [filteredPayments, startDate]);

  const revenueByPlan = useMemo(() => {
    const groups: Record<string, { count: number; amount: number }> = {};

    activeSubscriptions.forEach(subscription => {
      const name = subscription.planName || 'Other';
      if (!groups[name]) {
        groups[name] = { count: 0, amount: 0 };
      }

      groups[name].count += 1;
      groups[name].amount += subscription.totalAmount;
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [activeSubscriptions]);

  const exportCSV = () => {
    const rows = [
      ['Payment Number', 'Customer', 'Date', 'Method', 'Amount (INR)', 'Status'],
      ...filteredPayments.map(payment => [
        payment.paymentNumber,
        payment.customerCompany,
        payment.paymentDate,
        payment.method,
        String(payment.amount),
        payment.status,
      ]),
    ];

    const csv = rows
      .map(row =>
        row.map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `subscriptiq-revenue-report-${period}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const maxRevenue = Math.max(
    ...monthlyRevenue.map(item => item.amount),
    1
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Analytics & Reports"
        subtitle="Revenue, subscriptions, payments and outstanding invoices."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              {([
                ['30d', '30 Days'],
                ['quarter', 'This Quarter'],
                ['ytd', 'Year to Date'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                    period === value
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Revenue Collected',
            value: formatCurrency(collectedRevenue),
            description: 'Successful payments in selected period',
            icon: TrendingUp,
            color: 'text-emerald-600',
          },
          {
            title: 'Active Subscriptions',
            value: activeSubscriptions.length,
            description: 'Active and trial subscriptions',
            icon: Users,
            color: 'text-blue-600',
          },
          {
            title: 'Outstanding Amount',
            value: formatCurrency(outstandingAmount),
            description: `${outstandingInvoices.length} unpaid invoices`,
            icon: FileText,
            color: 'text-amber-600',
          },
          {
            title: 'Overdue Amount',
            value: formatCurrency(overdueAmount),
            description: `${overdueInvoices.length} overdue invoices`,
            icon: AlertCircle,
            color: 'text-rose-600',
          },
        ].map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>

              <p className="text-2xl font-bold text-slate-900 mt-3">
                {item.value}
              </p>

              <p className="text-xs text-slate-500 mt-2">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue report */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900">
              Monthly Revenue Report
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Based on successful payment transactions
            </p>
          </div>
          <Calendar className="w-5 h-5 text-slate-400" />
        </div>

        {monthlyRevenue.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            No revenue data available for this period.
          </p>
        ) : (
          <div className="space-y-5 mt-5">
            {monthlyRevenue.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#B87345] h-full rounded-full"
                    style={{
                      width: `${(item.amount / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription report */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">
            Active Subscriptions by Plan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Subscription counts and recorded subscription values
          </p>
        </div>

        {revenueByPlan.length === 0 ? (
          <p className="text-sm text-slate-500 p-6 text-center">
            No active subscriptions available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3 text-center">Subscriptions</th>
                  <th className="px-5 py-3 text-right">Total Value</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {revenueByPlan.map((plan, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {plan.name}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {plan.count}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {formatCurrency(plan.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue invoices */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">
            Overdue Invoice Report
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Invoices with unpaid balances past their due date
          </p>
        </div>

        {overdueInvoices.length === 0 ? (
          <p className="text-sm text-slate-500 p-6 text-center">
            No overdue invoices.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Outstanding</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {overdueInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {invoice.customerCompany}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {invoice.dueDate}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-rose-600">
                      {formatCurrency(invoice.outstandingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional information */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              Report information
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Revenue is calculated from successful payment records.
              Outstanding and overdue amounts are calculated from invoice
              balances. Subscription values represent recorded subscription
              totals, not normalized monthly recurring revenue.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Customers represented in records: {uniqueCustomers.size}.
              Customer records loaded: {customers.length}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
