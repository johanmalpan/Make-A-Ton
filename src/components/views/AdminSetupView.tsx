import React, { useState } from 'react';
import { ShieldCheck, Check, AlertCircle, ArrowRight, Sparkles, Lock, Mail, User } from 'lucide-react';
import { api, setStoredAuth } from '../../services/api';

interface AdminSetupViewProps {
  onSuccess: () => void;
}

export const AdminSetupView: React.FC<AdminSetupViewProps> = ({ onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password policy live checks
  const checks = {
    length: password.length > 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };
  const isPolicySatisfied = checks.length && checks.upper && checks.lower && checks.special;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPolicySatisfied) {
      setError('Password must satisfy all policy requirements (more than 8 characters, uppercase, lowercase, and special character).');
      return;
    }

    try {
      setLoading(true);
      const res = await api.bootstrapAdmin({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.token) {
        setStoredAuth(res.token, res.user);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize administrator account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#111927] flex flex-col justify-center items-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-[#192233] border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#944a27] to-[#b85d32] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg shadow-[#944a27]/25">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5 font-mono">
            Subscript<span className="text-[#e27d4c]">IQ</span>
          </h1>
          <p className="text-xs text-slate-400">
            Initial Platform Setup • Create First Administrator
          </p>
        </div>

        <div className="p-3.5 bg-[#944a27]/10 border border-[#944a27]/30 rounded-xl text-xs text-amber-200/90 leading-relaxed">
          <div className="font-semibold text-white mb-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#e27d4c]" />
            Clean Installation Detected
          </div>
          Welcome to SubscriptIQ. This installation has no existing records. Configure your primary Super Administrator account below to initialize the system.
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Administrator Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Administrator Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourcompany.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong administrator password"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27] focus:border-transparent"
              />
            </div>

            {/* Password Policy Checklist */}
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[11px]">
              <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.length ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>&gt; 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.upper ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.upper ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Uppercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.lower ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.lower ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Lowercase letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                <Check className={`w-3.5 h-3.5 ${checks.special ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Special character</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !fullName || !email || !isPolicySatisfied}
            className="w-full mt-2 py-2.5 px-4 bg-[#944a27] hover:bg-[#833f20] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#944a27]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <span>Initializing Administrator Account...</span>
            ) : (
              <>
                <span>Complete Setup & Enter Platform</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500">
          SubscriptIQ Enterprise Billing Engine • Architecture Audit Compliant
        </p>

      </div>
    </div>
  );
};
