import React, { useState } from 'react';
import { Plus, FileSpreadsheet, Repeat, Check, Trash2, Send } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Quotation, QuotationStatus } from '../types/quotation';
import { Customer } from '../types/customer';
import { SubscriptionPlan } from '../types/plan';
import { Product } from '../types/product';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, addDays, getTodayDateString } from '../utils/formatDate';
import { quotationService } from '../services/quotationService';

interface QuotationsProps {
  quotations: Quotation[];
  customers: Customer[];
  plans: SubscriptionPlan[];
  products: Product[];
  onRefresh: () => void;
  onNavigateToSubscriptions: () => void;
}

export const Quotations: React.FC<QuotationsProps> = ({
  quotations,
  customers,
  plans,
  products,
  onRefresh,
  onNavigateToSubscriptions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [terms, setTerms] = useState('Standard enterprise terms with 99.99% SLA');
  const [validityDays, setValidityDays] = useState(21);

  const filtered = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConvert = (quoteId: string) => {
    const result = quotationService.confirmAndConvertToSubscription(quoteId);
    if (result) {
      alert(`Proposal confirmed! Converted into active subscription ${result.subscription.subscriptionNumber}.`);
      onRefresh();
      onNavigateToSubscriptions();
    }
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId) || customers[0];
    const plan = plans.find((p) => p.id === planId) || plans[0];
    if (!cust || !plan) return;

    const subtotal = plan.price * plan.minQuantity;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxable = subtotal - discountAmount;
    const taxAmount = (taxable * 18) / 100;
    const totalAmount = taxable + taxAmount;

    quotationService.create({
      customerId: cust.id,
      customerName: cust.name,
      customerCompany: cust.company,
      customerEmail: cust.email,
      planId: plan.id,
      planName: plan.name,
      billingCycle: plan.billingCycle,
      lineItems: [
        {
          id: `item-${Date.now()}`,
          productId: plan.productId || products[0]?.id || 'prod-101',
          productName: plan.name,
          quantity: plan.minQuantity,
          unitPrice: plan.price,
          total: subtotal,
        },
      ],
      subtotal,
      discountPercentage,
      discountAmount,
      taxAmount,
      totalAmount,
      validityDate: addDays(getTodayDateString(), validityDays),
      status: 'sent',
      terms,
    });

    setIsFormOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations & Sales Proposals"
        subtitle="Odoo Sales Order workflow: Draft client proposals, apply negotiated discounts, and convert into subscriptions"
        action={
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by quote number, prospect, or plan..."
          className="w-full sm:w-80"
        />

        <div className="text-xs text-slate-500">
          Proposal Pipeline: <strong className="font-mono text-slate-900 font-bold">{quotations.length} Orders</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Sales Order #</th>
                <th className="py-3 px-4">Prospect / Client</th>
                <th className="py-3 px-4">Proposed Plan</th>
                <th className="py-3 px-4 text-right">Value (INR)</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {quote.quotationNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {quote.customerCompany}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Attn: {quote.customerName}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{quote.planName}</div>
                    <div className="text-[11px] text-slate-400 font-normal capitalize">
                      {quote.billingCycle} cadence
                      {quote.discountPercentage > 0 && ` · ${quote.discountPercentage}% discount applied`}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(quote.totalAmount)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] tabular-nums">
                    {formatDate(quote.validityDate)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={quote.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {quote.status !== 'accepted' ? (
                      <button
                        onClick={() => handleConvert(quote.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                        title="Confirm & Convert into Active Subscription"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Confirm & Convert</span>
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Converted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Quotation Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
              Create Subscription Quotation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Prepare formal proposal with plans, product line items, and validity duration
            </p>

            <form onSubmit={handleCreateQuotation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Plan</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)}/{p.billingCycle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contract Terms</label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold"
                >
                  Send Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
