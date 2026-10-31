import React, { useState } from 'react';
import { Plus, FileText, Eye, CreditCard, Send, Printer } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoiceDetailModal } from '../components/modals/InvoiceDetailModal';
import { Invoice } from '../types/invoice';
import { Customer } from '../types/customer';
import { Subscription } from '../types/subscription';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { invoiceService } from '../services/invoiceService';

interface InvoicesProps {
  invoices: Invoice[];
  customers: Customer[];
  subscriptions: Subscription[];
  onRefresh: () => void;
  onOpenRecordPayment: (invoiceId: string) => void;
  onSendReminder: (inv: Invoice) => void;
}

export const Invoices: React.FC<InvoicesProps> = ({
  invoices,
  customers,
  subscriptions,
  onRefresh,
  onOpenRecordPayment,
  onSendReminder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter((i) => {
    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveInvoice = (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'outstandingBalance'>) => {
    invoiceService.create(data);
    setIsFormOpen(false);
    onRefresh();
  };

  const handleMarkPaid = (id: string) => {
    const inv = invoiceService.getById(id);
    if (inv) {
      invoiceService.recordPayment(id, inv.outstandingBalance || inv.totalAmount);
      onRefresh();
      setSelectedInvoice(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Accounts Receivable"
        subtitle="Manage recurring subscription invoices, line item tax deductions, and payment settlement status"
        action={
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-[#15966B] hover:bg-[#107553] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Tax Invoice</span>
          </button>
        }
      />

      {/* Status Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        {[
          { id: 'all', label: 'All Invoices' },
          { id: 'paid', label: 'Paid in Full' },
          { id: 'posted', label: 'Posted (Due)' },
          { id: 'overdue', label: 'Overdue Dunning' },
          { id: 'draft', label: 'Draft' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by invoice number, customer company, or contact..."
          className="w-full sm:w-80"
        />

        <div className="text-xs text-slate-500">
          Total Displayed: <strong className="font-mono text-slate-900">{filtered.length} Invoices</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total (INR)</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 group-hover:text-emerald-700">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {inv.customerCompany}
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      {inv.customerName}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] tabular-nums">
                    {formatDate(inv.issueDate)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] tabular-nums">
                    <span className={inv.status === 'overdue' ? 'text-rose-600 font-semibold' : ''}>
                      {formatDate(inv.dueDate)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                    {formatCurrency(inv.subtotal)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(inv.totalAmount)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                    {inv.outstandingBalance > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        {formatCurrency(inv.outstandingBalance)}
                      </span>
                    ) : (
                      <span className="text-slate-400">₹0.00</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={inv.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {inv.outstandingBalance > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRecordPayment(inv.id);
                          }}
                          title="Record Payment"
                          className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 font-semibold text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Form Modal */}
      <InvoiceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveInvoice}
        customers={customers}
        subscriptions={subscriptions}
      />

      {/* Invoice Detail & Receipt Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onMarkAsPaid={handleMarkPaid}
        onSendReminder={onSendReminder}
      />
    </div>
  );
};
