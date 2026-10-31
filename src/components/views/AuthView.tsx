import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, ShieldCheck, Check, AlertCircle, Lock, Mail, User, Building2, Phone, MapPin, ArrowRight } from 'lucide-react';
import { api, setStoredAuth } from '../../services/api';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
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
  const [tokenSent, setTokenSent] = useState(false);

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
      const res = await api.login(email.trim().toLowerCase(), password);
      setStoredAuth(res.token, res.user, res.customer);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regPwCheck.length || !regPwCheck.upper || !regPwCheck.lower || !regPwCheck.special) {
      setError('Password must satisfy all policy requirements (more than 8 characters, uppercase, lowercase, and special character).');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        full_name: regName.trim(),
        company: regCompany.trim(),
        phone: regPhone.trim(),
        billing_address: regAddress.trim()
      });
      setStoredAuth(res.token, res.user, res.customer);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotEmail.trim().toLowerCase());
      setSuccessMsg(res.message);
      setTokenSent(true);
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
      setError('New password must be more than 8 characters with uppercase, lowercase, and special character.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword(resetToken.trim(), newPassword);
      setSuccessMsg(res.message || 'Password updated successfully. You may now sign in.');
      setTab('login');
      setEmail(forgotEmail);
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#111927] flex flex-col justify-center items-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-[#192233] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Brand Header */}
        <div className="p-6 text-center border-b border-slate-800/80 bg-[#141b29]">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#944a27] to-[#b85d32] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-lg shadow-[#944a27]/25">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5 font-mono">
            Subscript<span className="text-[#e27d4c]">IQ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Subscription Lifecycle & Recurring Billing Platform
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 text-xs font-semibold text-center bg-slate-900/60">
          <button
            onClick={() => { setTab('login'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 transition-all border-b-2 ${
              tab === 'login' ? 'border-[#944a27] text-white font-bold bg-[#192233]' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 transition-all border-b-2 ${
              tab === 'register' ? 'border-[#944a27] text-white font-bold bg-[#192233]' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Customer Register
          </button>
          <button
            onClick={() => { setTab('forgot'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-3 transition-all border-b-2 ${
              tab === 'forgot' ? 'border-[#944a27] text-white font-bold bg-[#192233]' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reset Password
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setForgotEmail(email); setError(null); }}
                    className="text-[11px] text-slate-400 hover:text-[#e27d4c] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27] focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-2.5 px-4 bg-[#944a27] hover:bg-[#833f20] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#944a27]/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {loading ? <span>Verifying credentials...</span> : <span>Sign In to Account</span>}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER CUSTOMER ACCOUNT */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company</label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Address</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="123 Business Way, Suite 100"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Password (Section 4 policy)"
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
                  <span className={regPwCheck.length ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    ✓ &gt; 8 chars
                  </span>
                  <span className={regPwCheck.upper ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    ✓ Uppercase
                  </span>
                  <span className={regPwCheck.lower ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    ✓ Lowercase
                  </span>
                  <span className={regPwCheck.special ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                    ✓ Special char
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !regName || !regEmail || !regPassword}
                className="w-full py-2.5 px-4 bg-[#944a27] hover:bg-[#833f20] disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#944a27]/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {loading ? <span>Creating customer portal account...</span> : <span>Create Customer Account</span>}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {!tokenSent ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter the email address registered with your SubscriptIQ account. A secure reset token will be issued.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !forgotEmail}
                    className="w-full py-2.5 px-4 bg-[#944a27] hover:bg-[#833f20] disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#944a27]/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <span>Processing request...</span> : <span>Send Reset Token</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reset Token</label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste 64-character token"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new compliant password"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#944a27]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetToken || !newPassword}
                    className="w-full py-2.5 px-4 bg-[#944a27] hover:bg-[#833f20] disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#944a27]/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <span>Updating password...</span> : <span>Update Password & Log In</span>}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-800 text-center text-[11px] text-slate-500">
          SubscriptIQ Subscription Management System
        </div>

      </div>
    </div>
  );
};
