import React, { useState } from 'react';
import { UserRole } from '../types';
import { Shield, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, customerId?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@brightloop.io');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'customer') {
      onLogin('customer', 'cust-201');
    } else {
      onLogin(selectedRole);
    }
  };

  const handleSelectPreset = (role: UserRole, presetEmail: string, customerId?: string) => {
    setSelectedRole(role);
    setEmail(presetEmail);
    onLogin(role, customerId);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex items-center gap-3 justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#101D2D] flex items-center justify-center shadow-md">
            <span className="font-heading font-black text-xl text-white tracking-wider">S</span>
            <span className="w-2 h-2 rounded-full bg-[#15966B] -ml-0.5 mt-2" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold font-heading text-[#101D2D] tracking-tight">
              Subscript<span className="text-[#15966B]">IQ</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Brightloop Software
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 font-heading">
          Subscription Management System
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Manage every subscription. Automate every billing cycle.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          {/* Quick Sign-In Presets */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Switch Demo Roles
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('admin', 'admin@brightloop.io')}
                className="p-3 text-left border border-slate-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    Administrator
                  </span>
                  <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Brightloop Ops Team
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('customer', 'rajesh.sharma@apexlogistics.in', 'cust-201')}
                className="p-3 text-left border border-slate-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    Customer Portal
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Apex Logistics India
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or enter credentials</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500 mr-2" />
                Remember session
              </label>
              <a href="#" className="font-semibold text-emerald-600 hover:text-emerald-500">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-[#101D2D] hover:bg-[#18293e] transition-colors"
            >
              Sign in to SubscriptIQ
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Powered by Brightloop Software • Enterprise Subscription Engine
          </div>
        </div>
      </div>
    </div>
  );
};
