import React, { useState } from 'react';
import { 
  Building2, 
  LogOut, 
  LogIn, 
  Zap, 
  Search, 
  Bell, 
  HelpCircle, 
  Sun, 
  ChevronRight 
} from 'lucide-react';
import { clearStoredAuth } from '../services/api';

interface NavbarProps {
  user: any;
  customer: any;
  onAuthChange: () => void;
  onOpenBillingModal: () => void;
  onOpenLoginModal: () => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  customer,
  onAuthChange,
  onOpenBillingModal,
  onOpenLoginModal,
  activeSection,
  setActiveSection
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    clearStoredAuth();
    onAuthChange();
    setShowUserMenu(false);
  };

  const sectionTitles: Record<string, string> = {
    dashboard: 'Operations Hub',
    subscriptions: 'Subscriptions Lifecycle',
    invoices: 'Invoices & Billing',
    quotations: 'Quotations & Templates',
    payments: 'Payments & Reconciliation',
    customers: 'Customers Directory',
    catalog: 'Catalog & Plans',
    'taxes-discounts': 'Taxes & Discounts',
    reports: 'Financial Reports',
    portal: 'Client Portal',
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 h-14 flex items-center justify-between text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Brightloop</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{sectionTitles[activeSection] || 'Operations Hub'}</span>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 rounded-lg border border-slate-200/70 w-84 text-xs text-slate-500 transition-all focus-within:ring-2 focus-within:ring-[#944a27]/15 focus-within:border-[#944a27]">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Search subscriptions, customers, invoices..." 
          className="bg-transparent border-none outline-none w-full text-xs text-slate-800 placeholder:text-slate-400"
        />
        <kbd className="hidden lg:inline-block text-[10px] bg-white border border-slate-200/90 rounded px-1.5 py-0.5 text-slate-400 font-mono shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex items-center gap-3">

        {/* Billing Engine Trigger Button */}
        {user?.role !== 'customer' && (
          <button
            onClick={onOpenBillingModal}
            title="Execute Recurring Billing Cycle"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300/80 font-semibold text-xs rounded-lg transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>Billing Engine</span>
          </button>
        )}

        {/* Utility Icons from reference screenshot */}
        <button 
          title="Help & Documentation" 
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </button>

        <button 
          title="Notifications" 
          className="relative text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <button 
          title="Light Mode" 
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Sun className="w-4.5 h-4.5" />
        </button>

        {/* User Status / Login */}
        {user ? (
          <div className="relative pl-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-100 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-200">
                {user.full_name?.charAt(0) || 'A'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user.full_name}</p>
                  <p className="text-slate-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Role: {user.role}
                  </span>
                </div>

                {user.role === 'customer' && (
                  <button
                    onClick={() => {
                      setActiveSection('portal');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-sky-600" />
                    Customer Portal
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#944a27] hover:bg-[#833f20] text-white font-medium text-xs rounded-lg transition-all shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}

      </div>
    </header>
  );
};
