import React, { useState } from 'react';
import { Plus, Users, Mail, Phone, MapPin, Repeat, FileText, ChevronRight, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Customer, CustomerTier } from '../types/customer';
import { Subscription } from '../types/subscription';
import { Invoice } from '../types/invoice';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { customerService } from '../services/customerService';

interface CustomersProps {
  customers: Customer[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  onRefresh: () => void;
  onNavigateToSubscription: (sub: Subscription) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  customers,
  subscriptions,
  invoices,
  onRefresh,
  onNavigateToSubscription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [tier, setTier] = useState<CustomerTier>('Enterprise');

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !name || !email) return;

    customerService.create({
      name,
      company,
      email,
      phone: phone || '+91 98000 00000',
      taxId: taxId || '27AAAAA0000A1Z5',
      address: {
        street: street || 'Commercial Tower',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      },
      tier,
      status: 'active',
      creditLimit: tier === 'Enterprise' ? 250000 : 50000,
    });

    setIsAddOpen(false);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    onRefresh();
  };

  const customerSubs = selectedCustomer
    ? subscriptions.filter((s) => s.customerId === selectedCustomer.id)
    : [];

  const customerInvs = selectedCustomer
    ? invoices.filter((i) => i.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage client accounts, GST details, contact personas, and contract histories"
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by company, contact person, or email..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {['all', 'Enterprise', 'Growth', 'Starter'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                tierFilter === t
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'all' ? 'All Tiers' : `${t} Tier`}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Organization & Contact</th>
                <th className="py-3 px-4">GSTIN / Tax ID</th>
                <th className="py-3 px-4">Account Tier</th>
                <th className="py-3 px-4">City / Region</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 group-hover:text-emerald-800">
                      {cust.company}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {cust.name} · {cust.email}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {cust.taxId || '— Unregistered —'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        cust.tier === 'Enterprise'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : cust.tier === 'Growth'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {cust.tier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    {cust.address.city}, {cust.address.state}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={cust.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(cust);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <span>History</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail & Subscription History Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {selectedCustomer.company}
                </h3>
                <p className="text-xs text-slate-500">Contact: {selectedCustomer.name}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Organization Contact Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state} - {selectedCustomer.address.postalCode}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-mono text-[11px] text-slate-500">
                  <span>GSTIN: <strong>{selectedCustomer.taxId}</strong></span>
                  <span>Credit Limit: <strong>{formatCurrency(selectedCustomer.creditLimit)}</strong></span>
                </div>
              </div>

              {/* Subscriptions History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Repeat className="w-4 h-4 text-emerald-600" />
                    Subscription Contracts ({customerSubs.length})
                  </span>
                </div>

                {customerSubs.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 text-slate-400 text-center">
                    No active subscriptions for this customer.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerSubs.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedCustomer(null);
                          onNavigateToSubscription(sub);
                        }}
                        className="p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">{sub.subscriptionNumber || sub.id}</span>
                          <StatusBadge status={sub.status} />
                        </div>
                        <div className="text-slate-700 font-medium mt-1">{sub.planName}</div>
                        <div className="flex justify-between items-center text-slate-400 text-[11px] mt-1">
                          <span>Renews: {formatDate(sub.nextRenewalDate)}</span>
                          <span className="font-mono font-semibold text-slate-900">{formatCurrency(sub.totalAmount)}/{sub.billingCycle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Invoices History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Billing Invoices History ({customerInvs.length})
                  </span>
                </div>

                {customerInvs.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 text-slate-400 text-center">
                    No invoices generated yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerInvs.map((inv) => (
                      <div key={inv.id} className="p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-slate-900">{inv.invoiceNumber}</span>
                          <StatusBadge status={inv.status} />
                        </div>
                        <div className="flex justify-between items-center text-slate-500 text-[11px] mt-1">
                          <span>Due: {formatDate(inv.dueDate)}</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in-50 zoom-in-95 duration-150">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
              Add New Customer Account
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Register corporate entity in SubscriptIQ customer directory
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics India Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as CustomerTier)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Enterprise">Enterprise</option>
                    <option value="Growth">Growth</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh@apexlogistics.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="27AABCA1234F1Z5"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
