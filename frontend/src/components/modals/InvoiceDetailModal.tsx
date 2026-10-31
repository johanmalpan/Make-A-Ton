import React from 'react';
import {
  X,
  Printer,
  Download,
  Send,
  CheckCircle2,
  Building,
  CreditCard,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onMarkAsPaid: (invoiceId: string) => void;
  onSendReminder: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onMarkAsPaid,
  onSendReminder,
}) => {
  if (!invoice) return null;

  const subtotal = invoice.subtotal || invoice.items.reduce((acc, it) => acc + it.total, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 my-8">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-900 text-base">
              Tax Invoice Details
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
              title="Print Tax Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Invoice Paper */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-xl text-[#101D2D]">
                  SubscriptIQ
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  Brightloop Software India
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Brightloop Software Technologies Pvt Ltd<br />
                Nariman Point, Marine Drive, Mumbai, MH 400021<br />
                GSTIN: 27AABCB9921D1Z8 · billing@brightloop.in
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block">
                {invoice.status === 'paid' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PAID IN FULL
                  </span>
                )}
                {invoice.status === 'posted' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                    <Calendar className="w-3.5 h-3.5" />
                    PAYMENT DUE
                  </span>
                )}
                {invoice.status === 'overdue' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    OVERDUE
                  </span>
                )}
                {invoice.status === 'draft' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    DRAFT
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                <div>Issue Date: <strong className="font-mono text-slate-800">{formatDate(invoice.issueDate)}</strong></div>
                <div>Due Date: <strong className="font-mono text-slate-800">{formatDate(invoice.dueDate)}</strong></div>
              </div>
            </div>
          </div>

          {/* Bill To & Subscription Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed To Customer
              </span>
              <div className="font-semibold text-slate-900 text-sm mt-0.5">
                {invoice.customerCompany}
              </div>
              <div className="text-slate-600 mt-0.5">
                Attention: {invoice.customerName}
              </div>
              <div className="text-slate-500">{invoice.customerEmail}</div>
            </div>
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Subscription Reference
              </span>
              <div className="font-mono font-medium text-slate-900 text-sm mt-0.5">
                {invoice.subscriptionNumber || invoice.subscriptionId || 'Direct Enterprise Contract'}
              </div>
              <div className="text-slate-500 mt-0.5">
                Automated recurring cycle via Odoo Invoicing Provider
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Item & Description</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations Breakdown */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-mono font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable GST (18%):</span>
                <span className="font-mono font-medium tabular-nums">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Invoice:</span>
                <span className="font-mono text-emerald-700 text-base tabular-nums">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
              {invoice.outstandingBalance !== undefined && (
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                  <span>Balance Due:</span>
                  <span className="font-mono font-bold text-rose-700 tabular-nums">
                    {formatCurrency(invoice.outstandingBalance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Payment Term: Net 15 Days
          </div>
          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' && (
              <>
                <button
                  onClick={() => onSendReminder(invoice)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-slate-500" />
                  Email Reminder
                </button>
                <button
                  onClick={() => onMarkAsPaid(invoice.id)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#15966B] hover:bg-[#107553] rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
