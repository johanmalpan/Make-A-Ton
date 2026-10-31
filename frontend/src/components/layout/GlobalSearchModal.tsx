import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Repeat,
  FileText,
  Users,
  Layers,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Subscription, Invoice, Customer, SubscriptionPlan } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  invoices: Invoice[];
  customers: Customer[];
  plans: SubscriptionPlan[];
  onSelectSubscription: (sub: Subscription) => void;
  onSelectInvoice: (inv: Invoice) => void;
  onSelectCustomer: (cust: Customer) => void;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}


export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  invoices,
  customers,
  plans,
  onSelectSubscription,
  onSelectInvoice,
  onSelectCustomer,
  onSelectPlan,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      !q ||
      s.id.toLowerCase().includes(q) ||
      s.customerCompany.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.planName.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredInvoices = invoices.filter(
    (i) =>
      !q ||
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.customerCompany.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredCustomers = customers.filter(
    (c) =>
      !q ||
      c.company.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
  ).slice(0, 3);

  const filteredPlans = plans.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
  ).slice(0, 3);

  const hasResults =
    filteredSubscriptions.length > 0 ||
    filteredInvoices.length > 0 ||
    filteredCustomers.length > 0 ||
    filteredPlans.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a subscription ID, invoice #, customer, or plan..."
            className="w-full py-4 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono ml-2">
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!hasResults ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Subscriptions */}
              {filteredSubscriptions.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                    Subscriptions
                  </div>
                  <div className="space-y-1">
                    {filteredSubscriptions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onSelectSubscription(sub);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {sub.id}
                            </span>
                            <span className="text-xs text-slate-600 truncate">
                              {sub.customerCompany}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {sub.planName} · {formatCurrency(sub.totalAmount || sub.subtotal)}/{sub.billingCycle}
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {filteredInvoices.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Invoices
                  </div>
                  <div className="space-y-1">
                    {filteredInvoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => {
                          onSelectInvoice(inv);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left transition-colors group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-900">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-xs text-slate-600">
                              {inv.customerCompany}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Due {inv.dueDate} · {formatCurrency(inv.totalAmount)} ·{' '}
                            <span className="capitalize">{inv.status}</span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {filteredCustomers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    Customers
                  </div>
                  <div className="space-y-1">
                    {filteredCustomers.map((cust) => (
                      <button
                        key={cust.id}
                        onClick={() => {
                          onSelectCustomer(cust);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left transition-colors group"
                      >
                        <div>
                          <div className="font-medium text-xs text-slate-900">{cust.company}</div>
                          <div className="text-xs text-slate-400">
                            {cust.name} · {cust.email} · {cust.tier} Tier
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          Details <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Plans */}
              {filteredPlans.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    Plans
                  </div>
                  <div className="space-y-1">
                    {filteredPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => {
                          onSelectPlan(plan);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-left transition-colors group"
                      >
                        <div>
                          <div className="font-medium text-xs text-slate-900">{plan.name}</div>
                          <div className="text-xs text-slate-400">
                            {formatCurrency(plan.price)}/{plan.billingCycle} · {plan.targetAudience}
                          </div>
                        </div>
                        <span className="text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
          <span>Quick search powered by SubscriptIQ Engine</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
