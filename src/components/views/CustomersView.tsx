import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Search, Building2, Phone, Mail, MapPin, Receipt, Repeat } from 'lucide-react';
import { api } from '../../services/api';

interface CustomersViewProps {
  onOpenNewCustomer: () => void;
  onEditCustomer: (customer: any) => void;
  onSelectInvoice: (invoiceId: string) => void;
  userRole?: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenNewCustomer,
  onEditCustomer,
  onSelectInvoice,
  userRole
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const list = await api.getCustomers();
      setCustomers(list);
    } catch (err: any) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id);
    try {
      const res = await api.getCustomer(id);
      setCustomerDetail(res);
    } catch (err: any) {
      alert(`Error loading details: ${err.message}`);
    }
  };

  const filtered = customers.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCo = c.company?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      return matchName || matchCo || matchEmail;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customers Directory</h2>
          <p className="text-xs text-slate-500">Corporate accounts, subscription portfolios & tax billing profiles</p>
        </div>

        {userRole !== 'customer' && (
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#944a27]/20 focus:border-[#944a27]"
          />
        </div>
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-xs text-slate-500 font-medium">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 p-12 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No Customers Registered</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              {search 
                ? 'No customers match your search query.'
                : 'Onboard your first subscriber or client account to begin managing subscriptions and quotes.'}
            </p>
            {userRole !== 'customer' && !search && (
              <button
                onClick={onOpenNewCustomer}
                className="px-3.5 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                + Register First Customer
              </button>
            )}
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{c.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{c.company || 'Individual Client'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.tax_id && (
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                      <span className="font-semibold text-slate-400">Tax ID:</span>
                      <span>{c.tax_id}</span>
                    </div>
                  )}
                </div>

                {/* Account Mini Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-semibold">Active Subs</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {c.active_subscriptions_count ?? 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-semibold">Outstanding</span>
                    <span className={`font-mono font-bold text-sm ${
                      (c.total_outstanding ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      ${(c.total_outstanding ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                {userRole !== 'customer' && (
                  <button
                    onClick={() => onEditCustomer(c)}
                    className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button
                  onClick={() => openCustomerDetail(c.id)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl ml-auto text-[11px]"
                >
                  View Account
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer 360 Account Detail Drawer */}
      {selectedCustomerId && customerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{customerDetail.customer.name}</h3>
                <p className="text-xs text-slate-500">{customerDetail.customer.company} • {customerDetail.customer.email}</p>
              </div>
              <button onClick={() => setSelectedCustomerId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <Users className="w-5 h-5" />
              </button>
            </div>

            {/* Subscriptions */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                Active Subscriptions ({customerDetail.subscriptions.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {customerDetail.subscriptions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No active subscriptions.</div>
                ) : (
                  customerDetail.subscriptions.map((s: any) => (
                    <div key={s.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{s.subscription_number}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="font-medium text-slate-700">{s.product_name} - {s.plan_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">${s.total_recurring_amount.toFixed(2)}/{s.billing_interval}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                Invoices History ({customerDetail.invoices.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {customerDetail.invoices.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No invoices.</div>
                ) : (
                  customerDetail.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="text-slate-500 font-mono">Issued: {inv.issue_date}</span>
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
                            setSelectedCustomerId(null);
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
                onClick={() => setSelectedCustomerId(null)}
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
