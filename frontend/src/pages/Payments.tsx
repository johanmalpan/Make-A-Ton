import React, { useState } from 'react';
import { Plus, CreditCard, Search, CheckCircle2, AlertCircle, Clock, RotateCcw } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { PaymentForm } from '../components/payments/PaymentForm';
import { Payment, PaymentMethod } from '../types/payment';
import { Invoice } from '../types/invoice';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { paymentService } from '../services/paymentService';

interface PaymentsProps {
  payments: Payment[];
  invoices: Invoice[];
  onRefresh: () => void;
}

export const Payments: React.FC<PaymentsProps> = ({
  payments,
  invoices,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [targetInvoiceId, setTargetInvoiceId] = useState<string | undefined>(undefined);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleSavePayment = (data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>) => {
    paymentService.create(data);
    setIsFormOpen(false);
    onRefresh();
  };

  const totalCollected = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Gateway Settlements"
        subtitle="Track collections across UPI, NetBanking, and RTGS against outstanding invoice balances"
        action={
          <button
            onClick={() => {
              setTargetInvoiceId(undefined);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Settled Collections</div>
            <div className="font-heading font-bold text-2xl text-emerald-700 tabular-nums mt-0.5">
              {formatCurrency(totalCollected, false)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Recorded Transactions</div>
            <div className="font-heading font-bold text-2xl text-slate-900 tabular-nums mt-0.5">
              {payments.length}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Supported Payment Rails</div>
            <div className="font-heading font-bold text-lg text-slate-900 mt-1">
              UPI · NetBanking · RTGS
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by transaction ID, invoice number, or customer..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto overflow-x-auto">
          {['all', 'UPI', 'NEFT_RTGS', 'NetBanking', 'CreditCard'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                methodFilter === m
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'all' ? 'All Rails' : m.replace('_', ' / ')}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Customer Organization</th>
                <th className="py-3 px-4">Invoice Reference</th>
                <th className="py-3 px-4">Payment Rail</th>
                <th className="py-3 px-4 text-right">Settled Amount (INR)</th>
                <th className="py-3 px-4">Bank Ref / UTR</th>
                <th className="py-3 px-4">Processed Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {pay.paymentNumber}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {pay.customerCompany}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {pay.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {pay.method.replace('_', ' / ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(pay.amount)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] tabular-nums">
                    {pay.referenceNumber}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px] tabular-nums">
                    {formatDate(pay.paymentDate)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={pay.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Form Modal */}
      <PaymentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSavePayment}
        invoices={invoices}
        initialInvoiceId={targetInvoiceId}
      />
    </div>
  );
};
