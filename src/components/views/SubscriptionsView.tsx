import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Plus, 
  Pause, 
  Play, 
  XCircle, 
  RotateCw, 
  Search, 
  Calendar, 
  Building2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

interface SubscriptionsViewProps {
  onOpenNewSubscription: () => void;
  onSelectInvoice: (invoiceId: string) => void;
  userRole?: string;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onOpenNewSubscription,
  onSelectInvoice,
  userRole
}) => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [subDetail, setSubDetail] = useState<any>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const list = await api.getSubscriptions();
      setSubscriptions(list);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handlePause = async (id: string) => {
    const reason = prompt('Please enter the reason for pausing this subscription:');
    if (!reason) return;
    try {
      await api.pauseSubscription(id, reason);
      loadSubscriptions();
      if (selectedSub?.id === id) viewDetails(id);
    } catch (err: any) {
      alert(`Error pausing subscription: ${err.message}`);
    }
  };

  const handleResume = async (id: string) => {
    if (!confirm('Resume this subscription? The billing period will recalibrate from today.')) return;
    try {
      await api.resumeSubscription(id);
      loadSubscriptions();
      if (selectedSub?.id === id) viewDetails(id);
    } catch (err: any) {
      alert(`Error resuming subscription: ${err.message}`);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Please enter the cancellation reason:');
    if (!reason) return;
    try {
      await api.cancelSubscription(id, reason);
      loadSubscriptions();
      if (selectedSub?.id === id) viewDetails(id);
    } catch (err: any) {
      alert(`Error cancelling subscription: ${err.message}`);
    }
  };

  const handleRenew = async (id: string) => {
    if (!confirm('Reactivate and renew this subscription?')) return;
    try {
      await api.renewSubscription(id);
      loadSubscriptions();
      if (selectedSub?.id === id) viewDetails(id);
    } catch (err: any) {
      alert(`Error renewing subscription: ${err.message}`);
    }
  };

  const viewDetails = async (id: string) => {
    try {
      const res = await api.getSubscription(id);
      setSelectedSub(res.subscription);
      setSubDetail(res);
    } catch (err: any) {
      alert(`Error fetching subscription details: ${err.message}`);
    }
  };

  const filtered = subscriptions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = s.subscription_number.toLowerCase().includes(q);
      const matchCust = s.customer_name?.toLowerCase().includes(q);
      const matchPlan = s.plan_name?.toLowerCase().includes(q);
      return matchNum || matchCust || matchPlan;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Subscriptions Lifecycle</h2>
          <p className="text-xs text-slate-500">Manage active, paused, cancelled, and renewing accounts</p>
        </div>

        {userRole !== 'customer' && (
          <button
            onClick={onOpenNewSubscription}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Provision Subscription
          </button>
        )}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'paused', 'cancelled', 'expired'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 ${
                filter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#944a27]/20 focus:border-[#944a27]"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            Loading subscriptions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Repeat className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Subscriptions Found</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              {search || filter !== 'all' 
                ? 'No subscriptions match your current filter and search criteria.' 
                : 'There are no subscriptions in the system. Create your first subscription or convert a quotation.'}
            </p>
            {userRole !== 'customer' && !search && filter === 'all' && (
              <button
                onClick={onOpenNewSubscription}
                className="px-3.5 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                + Create Subscription
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Subscription #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Product</th>
                  <th className="py-3 px-4">Interval</th>
                  <th className="py-3 px-4">Recurring Total</th>
                  <th className="py-3 px-4">Current Period</th>
                  <th className="py-3 px-4">Next Bill Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => viewDetails(sub.id)}
                        className="text-[#944a27] hover:text-[#833f20] font-semibold hover:underline"
                      >
                        {sub.subscription_number}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{sub.customer_name}</span>
                      <span className="text-[10px] text-slate-400">{sub.customer_company || sub.customer_email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 block">{sub.plan_name}</span>
                      <span className="text-[10px] text-slate-500">{sub.product_name}</span>
                    </td>
                    <td className="py-3 px-4 font-medium capitalize text-slate-600">
                      {sub.billing_interval}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ${sub.total_recurring_amount?.toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal block">({sub.quantity} seat{sub.quantity > 1 ? 's' : ''})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {sub.current_period_start} &rarr; {sub.current_period_end}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {sub.next_billing_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        sub.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        sub.status === 'paused' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        sub.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {userRole !== 'customer' && (
                          <>
                            {sub.status === 'active' && (
                              <button
                                onClick={() => handlePause(sub.id)}
                                title="Pause Subscription"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {sub.status === 'paused' && (
                              <button
                                onClick={() => handleResume(sub.id)}
                                title="Resume Subscription"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {sub.status === 'active' && (
                              <button
                                onClick={() => handleCancel(sub.id)}
                                title="Cancel Subscription"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {['cancelled', 'expired'].includes(sub.status) && (
                              <button
                                onClick={() => handleRenew(sub.id)}
                                title="Renew / Reactivate"
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => viewDetails(sub.id)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Detail Drawer / Modal */}
      {selectedSub && subDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-slate-900">{selectedSub.subscription_number}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  selectedSub.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                  selectedSub.status === 'paused' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedSub.status}
                </span>
              </div>
              <button onClick={() => setSelectedSub(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Subscriber</span>
                <span className="font-semibold text-slate-800 block">{selectedSub.customer_name}</span>
                <span className="text-slate-500">{selectedSub.customer_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Plan Details</span>
                <span className="font-semibold text-slate-800 block">{selectedSub.product_name} - {selectedSub.plan_name}</span>
                <span className="capitalize text-slate-500 font-mono">${selectedSub.unit_price}/{selectedSub.billing_interval} x {selectedSub.quantity}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Current Cycle</span>
                <span className="font-mono font-medium text-slate-700">{selectedSub.current_period_start} to {selectedSub.current_period_end}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Next Billing Date</span>
                <span className="font-mono font-bold text-indigo-600">{selectedSub.next_billing_date}</span>
              </div>
              {selectedSub.pause_reason && (
                <div className="col-span-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <span className="font-semibold">Paused Reason: </span>{selectedSub.pause_reason} (Paused on {selectedSub.paused_at})
                </div>
              )}
              {selectedSub.cancel_reason && (
                <div className="col-span-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-semibold">Cancellation Reason: </span>{selectedSub.cancel_reason}
                </div>
              )}
            </div>

            {/* Line Items stored in subscription_items */}
            {subDetail.items && subDetail.items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#944a27]" />
                  Subscription Line Items
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {subDetail.items.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{item.description}</span>
                        {item.variant_name && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                            {item.variant_name}
                          </span>
                        )}
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-500 font-mono">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">${item.total_amount.toFixed(2)}</span>
                        {item.tax_amount > 0 && (
                          <span className="text-[10px] text-slate-400 block font-mono">Incl. Tax ${item.tax_amount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Invoices */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Invoices Generated for this Subscription
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {subDetail.invoices.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No invoices generated yet.</div>
                ) : (
                  subDetail.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-500 font-mono">Due: {inv.due_date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">${inv.total_amount.toFixed(2)}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSub(null);
                            onSelectInvoice(inv.id);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
