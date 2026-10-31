import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { InvoiceDetailModal } from '../components/modals/InvoiceDetailModal';
import { customerService } from '../services/customerService';
import { subscriptionService } from '../services/subscriptionService';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { Invoice, Subscription, Payment, Customer } from '../types';
import {
  CreditCard,
  Building,
  Mail,
  Phone,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Eye,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const customers = customerService.getAll();
  // Default to first customer (Rajesh Sharma)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || 'cust-201');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments'>('overview');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  const selectedCustomer: Customer | undefined = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const customerSubscriptions: Subscription[] = subscriptionService.getByCustomerId(selectedCustomerId);
  const customerInvoices: Invoice[] = invoiceService.getByCustomerId(selectedCustomerId);
  const allPayments = paymentService.getAll();
  const customerPayments: Payment[] = allPayments.filter(p => p.customerId === selectedCustomerId);

  // Financial summary
  const totalOutstanding = customerInvoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.outstandingBalance, 0);

  const totalPaid = customerPayments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeSubCount = customerSubscriptions.filter(s => s.status === 'active' || s.status === 'in_trial').length;

  const handlePayInvoice = (invoice: Invoice) => {
    setIsProcessingPayment(invoice.id);
    setTimeout(() => {
      paymentService.create({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerCompany: invoice.customerCompany,
        amount: invoice.outstandingBalance,
        method: 'UPI',
        referenceNumber: `UPI_PORTAL_${Date.now().toString().slice(-6)}`,
        status: 'succeeded',
        paymentDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
        notes: 'Instant customer self-service settlement via SubscriptIQ Portal',
      });
      setIsProcessingPayment(null);
    }, 800);
  };

  const handleToggleAutoRenew = (sub: Subscription) => {
    subscriptionService.update(sub.id, { autoRenew: !sub.autoRenew });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Self-Service Portal"
        subtitle="Secure subscriber view for managing contracts, downloading tax invoices, and instant billing settlement."
        action={
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Viewing as:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="text-xs font-semibold text-slate-900 bg-transparent outline-hidden cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Customer Header Card */}
      {selectedCustomer && (
        <div className="bg-gradient-to-r from-[#101D2D] to-[#1e344f] rounded-2xl p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-heading font-bold text-xl text-emerald-400">
                {selectedCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold font-heading">{selectedCustomer.name}</h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                    {selectedCustomer.tier} Subscriber
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCustomer.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCustomer.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCustomer.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Balances summary */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Due Balance</div>
                <div className={`font-mono text-lg font-bold ${totalOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatCurrency(totalOutstanding)}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Active Services</div>
                <div className="font-mono text-lg font-bold text-white">
                  {activeSubCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-[#15966B] text-[#15966B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Account Overview
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'border-[#15966B] text-[#15966B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          My Subscriptions ({customerSubscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-[#15966B] text-[#15966B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoices & Receipts ({customerInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-[#15966B] text-[#15966B]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment History ({customerPayments.length})
        </button>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Outstanding Invoice Banner if any */}
          {totalOutstanding > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-900 text-sm">
                    You have an outstanding balance of {formatCurrency(totalOutstanding)}
                  </div>
                  <div className="text-xs text-amber-700">
                    Settle your pending invoices to ensure uninterrupted SaaS service and API access.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('invoices')}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
              >
                Review Invoices
              </button>
            </div>
          )}

          {/* Quick grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Subscription card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 font-heading text-sm">Current Active Plan</h3>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Subscribed
                </span>
              </div>

              {customerSubscriptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">No active subscriptions found.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {customerSubscriptions.slice(0, 2).map((sub) => (
                    <div key={sub.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{sub.planName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {sub.billingCycle.toUpperCase()} • Renewal: {formatDate(sub.nextRenewalDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(sub.totalAmount)}
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GST & Billing profile */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 font-heading text-sm">Billing & GST Profile</h3>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">GSTIN Tax Identifier:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedCustomer?.taxId || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Billing Address:</span>
                  <span className="text-slate-800 text-right max-w-xs truncate">
                    {selectedCustomer?.address?.street}, {selectedCustomer?.address?.city}, {selectedCustomer?.address?.state} {selectedCustomer?.address?.postalCode}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Total Lifetime Payments:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-900 font-heading text-sm">My Subscription Contracts</h3>
              <p className="text-xs text-slate-500">Review your recurring packages and auto-renewal mandates</p>
            </div>
          </div>

          {customerSubscriptions.length === 0 ? (
            <EmptyState
              title="No subscriptions found"
              description="You have no active subscription plans associated with your account."
              icon={RefreshCw}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">Contract ID</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Recurrence</th>
                    <th className="py-3 px-4">Next Renewal</th>
                    <th className="py-3 px-4 text-right">Cycle Cost</th>
                    <th className="py-3 px-4">Auto-Renew</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-900">
                        {sub.subscriptionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {sub.planName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sub.billingCycle}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(sub.nextRenewalDate)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(sub.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAutoRenew(sub)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                            sub.autoRenew
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {sub.autoRenew ? 'Enabled (Active)' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={sub.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoices tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-900 font-heading text-sm">Tax Invoices & Statements</h3>
              <p className="text-xs text-slate-500">Download GST-compliant tax invoices or settle open balances</p>
            </div>
          </div>

          {customerInvoices.length === 0 ? (
            <EmptyState
              title="No invoices found"
              description="No invoices have been billed to your account yet."
              icon={FileText}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">Invoice No.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Total (INR)</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.outstandingBalance)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded border border-slate-200 hover:bg-slate-100 transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.outstandingBalance > 0 && (
                            <button
                              onClick={() => handlePayInvoice(inv)}
                              disabled={isProcessingPayment === inv.id}
                              className="px-3 py-1 bg-[#15966B] hover:bg-[#12805b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
                            >
                              {isProcessingPayment === inv.id ? 'Settling...' : 'Pay Now'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments tab */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-900 font-heading text-sm">Settlement & Receipt Ledger</h3>
              <p className="text-xs text-slate-500">History of all transactions processed against your subscriptions</p>
            </div>
          </div>

          {customerPayments.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="No payment transactions found on your account ledger."
              icon={CreditCard}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {p.paymentDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {p.method}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoice modal */}
      {viewInvoice && (
        <InvoiceDetailModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
          onMarkAsPaid={(invId) => {
            invoiceService.update(invId, { status: 'paid', outstandingBalance: 0, paidAmount: viewInvoice.totalAmount });
            setViewInvoice(null);
          }}
          onSendReminder={() => alert(`Receipt downloaded for ${viewInvoice.invoiceNumber}`)}
        />
      )}
    </div>
  );
};
