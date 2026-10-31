import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCheck,
  ChevronDown,
  Shield,
  Sliders,
  LogOut,
  Building,
  User,
  ArrowRightLeft,
} from 'lucide-react';
import { NavigationPath, UserSession } from '../../types';

interface HeaderProps {
  currentPath: NavigationPath;
  userSession: UserSession;
  onOpenMobileSidebar: () => void;
  onOpenSearchModal: () => void;
  onNavigate: (path: NavigationPath) => void;
  onSwitchRole: (role: 'admin' | 'customer') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  userSession,
  onOpenMobileSidebar,
  onOpenSearchModal,
  onNavigate,
  onSwitchRole,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const getBreadcrumbTitle = (path: NavigationPath): { section: string; title: string } => {
    switch (path) {
      case 'dashboard':
        return { section: 'Workspace', title: 'Admin Dashboard' };
      case 'products':
        return { section: 'Workspace', title: 'Products' };
      case 'plans':
        return { section: 'Workspace', title: 'Subscription Plans' };
      case 'customers':
        return { section: 'Workspace', title: 'Customer Directory' };
      case 'subscriptions':
        return { section: 'Billing', title: 'Subscriptions' };
      case 'quotations':
        return { section: 'Billing', title: 'Quotations & Proposals' };
      case 'invoices':
        return { section: 'Billing', title: 'Invoices Ledger' };
      case 'payments':
        return { section: 'Billing', title: 'Payments & Transactions' };
      case 'discounts':
        return { section: 'Management', title: 'Discounts & Promo Codes' };
      case 'taxes':
        return { section: 'Management', title: 'Taxes & Fiscal Rules' };
      case 'reports':
        return { section: 'Insights', title: 'Revenue & Cohort Reports' };
      case 'portal':
        return { section: 'Client Portal', title: 'My Subscriptions & Invoices' };
      default:
        return { section: 'General', title: 'System' };
    }
  };

  const breadcrumb = getBreadcrumbTitle(currentPath);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center text-xs lg:text-sm text-slate-500 min-w-0">
            <span className="font-semibold text-slate-700 hidden sm:inline">Brightloop Software</span>
            <span className="mx-2 text-slate-400 hidden sm:inline">/</span>
            <span className="text-slate-500 font-medium">{breadcrumb.section}</span>
            <span className="mx-2 text-slate-400">/</span>
            <span className="font-heading font-bold text-slate-900 truncate">
              {breadcrumb.title}
            </span>
          </nav>
        </div>

        {/* Center / Right: Search, Role Switcher, Notifications & Profile */}
        <div className="flex items-center gap-2 lg:gap-3.5 shrink-0">
          {/* Quick Search Field */}
          <button
            onClick={onOpenSearchModal}
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors w-36 sm:w-60 text-left group"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
            <span className="truncate">Search records...</span>
            <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Role Simulation Switcher (Admin <-> Customer Portal) */}
          <button
            onClick={() => onSwitchRole(userSession.role === 'admin' ? 'customer' : 'admin')}
            title="Switch between Admin Dashboard & Customer Self-Service Portal"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>
              {userSession.role === 'admin' ? 'View as Customer' : 'Switch to Admin'}
            </span>
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <span className="font-heading font-bold text-xs text-slate-900">Notifications</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs">
                  <div className="p-3 hover:bg-slate-50">
                    <div className="font-semibold text-slate-800">RTGS Payment Settled</div>
                    <p className="text-slate-500 mt-0.5">Apex Logistics settled Invoice #INV/2026/00891 (₹94,398.82).</p>
                  </div>
                  <div className="p-3 hover:bg-slate-50">
                    <div className="font-semibold text-slate-800">Upcoming Renewal Warning</div>
                    <p className="text-slate-500 mt-0.5">Lumina Diagnostics renewal due in 15 days.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg transition-colors group"
            >
              <img
                src="/src/assets/images/avatar_admin_user_1793420784784.jpg"
                alt={userSession.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 group-hover:ring-emerald-500 transition-colors"
              />
              <div className="text-left hidden lg:block leading-tight">
                <div className="font-semibold text-xs text-slate-800 truncate max-w-[120px]">
                  {userSession.name}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {userSession.role.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 duration-150 text-xs">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-semibold text-slate-900">{userSession.name}</div>
                  <div className="text-slate-500 text-[11px] truncate">{userSession.email}</div>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Shield className="w-3 h-3" />
                    {userSession.role === 'admin' ? 'System Administrator' : 'Client Subscriber'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('portal');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Customer Self-Service Portal
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('reports');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    Financial Audit Logs
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
