import React, { useState } from 'react';
import { X, LogIn, UserPlus, KeyRound, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { api, setStoredAuth } from '../../services/api';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenReceived, setTokenReceived] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live password policy checks
  const checkPolicy = (pw: string) => ({
    length: pw.length > 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw),
  });

  const regPwCheck = checkPolicy(regPassword);
  const resetPwCheck = checkPolicy(newPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);
      setStoredAuth(res.token, res.user, res.customer);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regPwCheck.length || !regPwCheck.upper || !regPwCheck.lower || !regPwCheck.special) {
      setError('Please fulfill all password policy requirements (more than 8 characters, uppercase, lowercase, special character).');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        email: regEmail,
        password: regPassword,
        full_name: regName,
        company: regCompany,
        phone: regPhone,
        billing_address: regAddress
      });
      setStoredAuth(res.token, res.user, res.customer);
      alert('Registration successful! Welcome to the SubscriptIQ Customer Portal.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotEmail);
      setSuccessMsg(res.message);
      setTokenReceived('sent');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetPwCheck.length || !resetPwCheck.upper || !resetPwCheck.lower || !resetPwCheck.special) {
      setError('New password must be more than 8 chars and contain uppercase, lowercase, and special characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword(resetToken, newPassword);
      alert(res.message);
      setTab('login');
      setEmail(forgotEmail);
      setSuccessMsg('Password updated. You may now log in.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#944a27] flex items-center justify-center text-white">
              {tab === 'login' && <LogIn className="w-4 h-4" />}
              {tab === 'register' && <UserPlus className="w-4 h-4" />}
              {tab === 'forgot' && <KeyRound className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {tab === 'login' ? 'Sign In to SubscriptIQ' : tab === 'register' ? 'Register Customer Account' : 'Password Recovery'}
              </h3>
              <p className="text-xs text-slate-500">Brightloop Software Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 text-xs font-semibold text-center bg-slate-50/50">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2.5 transition-all border-b-2 ${
              tab === 'login' ? 'border-[#944a27] text-[#944a27] bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2.5 transition-all border-b-2 ${
              tab === 'register' ? 'border-[#944a27] text-[#944a27] bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Register
          </button>
          <button
            onClick={() => { setTab('forgot'); setError(null); }}
            className={`flex-1 py-2.5 transition-all border-b-2 ${
              tab === 'forgot' ? 'border-[#944a27] text-[#944a27] bg-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reset Password
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@brightloop.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setForgotEmail(email); }}
                    className="text-[11px] text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Create secure password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />

                {/* Password policy checklist */}
                <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-1 text-[10px]">
                  <span className={`flex items-center gap-1 ${regPwCheck.length ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> &gt; 8 characters
                  </span>
                  <span className={`flex items-center gap-1 ${regPwCheck.upper ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> 1 uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1 ${regPwCheck.lower ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> 1 lowercase (a-z)
                  </span>
                  <span className={`flex items-center gap-1 ${regPwCheck.special ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> 1 special (!@#$%)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold rounded-lg shadow-sm transition-all"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT / RESET PASSWORD */}
          {tab === 'forgot' && (
            <div className="space-y-4 text-xs">
              {!tokenReceived ? (
                <form onSubmit={handleForgotRequest} className="space-y-3">
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Enter your registered email address. A single-use reset token will be issued.
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Registered Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@acmecorp.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold rounded-lg shadow-sm transition-all"
                  >
                    {loading ? 'Generating...' : 'Request Password Reset'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                    <span className="font-bold block text-[10px] text-emerald-700 uppercase mb-0.5">Instructions Dispatched</span>
                    Please enter the reset token dispatched to <span className="font-semibold">{forgotEmail}</span>:
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Reset Token *</label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Secure Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                    <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 gap-1 text-[10px]">
                      <span className={`flex items-center gap-1 ${resetPwCheck.length ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3 h-3" /> &gt; 8 characters
                      </span>
                      <span className={`flex items-center gap-1 ${resetPwCheck.upper ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3 h-3" /> 1 uppercase (A-Z)
                      </span>
                      <span className={`flex items-center gap-1 ${resetPwCheck.lower ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3 h-3" /> 1 lowercase (a-z)
                      </span>
                      <span className={`flex items-center gap-1 ${resetPwCheck.special ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3 h-3" /> 1 special (!@#$%)
                      </span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#944a27] hover:bg-[#833f20] text-white font-semibold rounded-lg shadow-sm transition-all"
                  >
                    {loading ? 'Updating...' : 'Set New Password'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
