import React, { useState } from 'react';
import { X, Zap, CheckCircle2, AlertTriangle, RefreshCw, Layers, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../../services/api';

interface BillingRunnerModalProps {
  onClose: () => void;
  onRunComplete: () => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export const BillingRunnerModal: React.FC<BillingRunnerModalProps> = ({
  onClose,
  onRunComplete,
  onViewInvoice
}) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async (force: boolean) => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runBillingCycle(force);
      setResult(res);
      onRunComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Zap className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Automated Recurring Billing Engine</h3>
              <p className="text-xs text-slate-500">Autonomous cycle scheduler & invoice generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              Engine Specifications & Safeguards
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              SubscriptIQ's recurring billing engine continuously inspects active subscriptions with due billing dates, calculates intervals (Daily, Weekly, Monthly, Yearly), verifies idempotency to prevent duplicate invoices, itemizes dynamic discounts and tax rules, advances cycle periods, and flags overdue balances.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Trigger Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleRun(false)}
              disabled={running}
              className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  Run Scheduled Due Cycle
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-xs">Standard</span>
              </div>
              <p className="text-[11px] text-indigo-700/80">
                Invoices subscriptions due on or before today ({new Date().toISOString().split('T')[0]}).
              </p>
            </button>

            <button
              onClick={() => handleRun(true)}
              disabled={running}
              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  Force Test Cycle (All Active)
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-white px-2 py-0.5 rounded shadow-xs">Audit</span>
              </div>
              <p className="text-[11px] text-amber-800/80">
                Tests recurring invoice generation across all active subscriptions regardless of due date.
              </p>
            </button>
          </div>

          {/* Results Display */}
          {running && (
            <div className="p-8 text-center space-y-2">
              <div className="w-8 h-8 border-4 border-[#944a27] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Evaluating active subscriptions & generating invoices...</p>
            </div>
          )}

          {result && !running && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subscriptions Checked</span>
                  <span className="text-lg font-black font-mono text-slate-900">{result.processedSubscriptions}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Invoices Generated</span>
                  <span className="text-lg font-black font-mono text-emerald-700">{result.invoicesGenerated}</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-600 block">Overdue Invoices</span>
                  <span className="text-lg font-black font-mono text-rose-700">{result.overdueInvoicesDetected}</span>
                </div>
              </div>

              {/* Execution Details Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Cycle Audit Trail</h4>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {result.details.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No subscriptions were due for billing at this time. All cycles are up to date!
                    </div>
                  ) : (
                    result.details.map((item: any, i: number) => (
                      <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{item.subscriptionNumber}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-medium text-slate-700">{item.customerName}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.action === 'invoiced' ? 'bg-emerald-100 text-emerald-800' :
                            item.action === 'skipped' ? 'bg-slate-100 text-slate-600' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {item.action}
                          </span>
                          {item.invoiceNumber && (
                            <span className="block font-mono text-indigo-600 font-semibold text-[11px] mt-0.5">
                              {item.invoiceNumber} (${item.amount?.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 rounded-lg shadow-2xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
