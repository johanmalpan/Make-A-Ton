import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Clock, ShieldCheck, AlertTriangle, Layers, FileSpreadsheet } from 'lucide-react';
import { api } from '../../services/api';

export const ReportsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [metrics, logs] = await Promise.all([
        api.getFinancialReport(),
        api.getAuditLogs()
      ]);
      setData(metrics);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportCSV = async (entity: 'invoices' | 'subscriptions' | 'customers' | 'payments') => {
    try {
      let rows: any[] = [];
      if (entity === 'invoices') rows = await api.getInvoices();
      else if (entity === 'subscriptions') rows = await api.getSubscriptions();
      else if (entity === 'customers') rows = await api.getCustomers();
      else if (entity === 'payments') rows = await api.getPayments();

      if (rows.length === 0) {
        alert(`No ${entity} records to export.`);
        return;
      }

      // Convert objects to CSV
      const keys = Object.keys(rows[0]);
      const csvContent = [
        keys.join(','),
        ...rows.map(row => keys.map(k => {
          let val = row[k];
          if (val === null || val === undefined) val = '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `subscriptiq_${entity}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-medium">
        Loading reports & audit data...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Financial Reports & Compliance Audit</h2>
          <p className="text-xs text-slate-500">Aging analysis, revenue retention, CSV data export, and immutable audit logs</p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV('invoices')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#944a27]" />
            Invoices CSV
          </button>
          <button
            onClick={() => handleExportCSV('subscriptions')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Subscriptions CSV
          </button>
          <button
            onClick={() => handleExportCSV('payments')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            Payments CSV
          </button>
        </div>
      </div>

      {/* Aging Analysis Overview */}
      <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Accounts Receivable Aging Report</h3>
            <p className="text-xs text-slate-500">Critical credit control metric tracking overdue collections across aging windows</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Past Due</span>
            <span className="text-xl font-black font-mono text-rose-600">${data.aging.totalOverdue.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">1 - 30 Days</span>
            <span className="text-xl font-black font-mono text-slate-900">${data.aging.days1_30.toFixed(2)}</span>
            <p className="text-[10px] text-amber-700 mt-1">First grace period reminder</p>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 block mb-1">31 - 60 Days</span>
            <span className="text-xl font-black font-mono text-slate-900">${data.aging.days31_60.toFixed(2)}</span>
            <p className="text-[10px] text-orange-700 mt-1">Secondary dunning escalation</p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">61 - 90 Days</span>
            <span className="text-xl font-black font-mono text-slate-900">${data.aging.days61_90.toFixed(2)}</span>
            <p className="text-[10px] text-rose-700 mt-1">Service limitation warning</p>
          </div>

          <div className="p-4 rounded-xl bg-red-100/70 border border-red-300/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-900 block mb-1">90+ Days</span>
            <span className="text-xl font-black font-mono text-slate-900">${data.aging.days90_plus.toFixed(2)}</span>
            <p className="text-[10px] text-red-800 mt-1">Critical collection review</p>
          </div>
        </div>
      </div>

      {/* Revenue & Billing Cycle Breakdown */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Revenue Contribution by Billing Frequency</h3>
          <p className="text-xs text-slate-500">Distribution of subscription cash flows across intervals</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.frequencyBreakdown && data.frequencyBreakdown.length > 0 ? (
            data.frequencyBreakdown.map((item: any) => (
              <div key={item.billing_interval} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {item.billing_interval} Recurring
                </span>
                <span className="text-lg font-black font-mono text-slate-900 block">
                  ${item.recurring_volume.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  {item.subscription_count} active accounts
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-4 p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No active subscription recurring revenue recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Compliance Audit Logs */}
      <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">System Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable chronological record of administrative actions, billing runs, and payments</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">{auditLogs.length} events logged</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No audit events logged yet. Administrative and billing operations will appear here chronologically.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl text-xs">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-800">{log.user_name || 'System Scheduler'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="capitalize text-slate-500 font-mono text-[10px]">{log.entity_type} {log.entity_id}</span>
                  </div>
                  {log.details_json && (
                    <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                      {log.details_json}
                    </p>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{log.created_at}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
