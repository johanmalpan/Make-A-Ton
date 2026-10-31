import React from 'react';
import { 
  LayoutDashboard, 
  Repeat, 
  FileText, 
  FileCheck2, 
  CreditCard, 
  Users, 
  Package, 
  Percent, 
  BarChart3, 
  ShieldAlert,
  Building2,
  Sparkles,
  Layers,
  Settings,
  LogOut,
  BadgePercent
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  userRole: 'admin' | 'staff' | 'customer' | undefined;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
  userRole,
  userName,
  userEmail,
  onLogout
}) => {
  const isCustomer = userRole === 'customer';

  // Navigation structure matching reference screenshot categories:
  // OVERVIEW, MANAGEMENT, FINANCE, ANALYTICS, ADMINISTRATION
  const adminGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'catalog', label: 'Products', icon: Package },
        { id: 'catalog', label: 'Plans', icon: Layers },
        { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { id: 'quotations', label: 'Quotations', icon: FileCheck2 },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'taxes-discounts', label: 'Discounts', icon: Percent },
        { id: 'taxes-discounts', label: 'Taxes', icon: BadgePercent },
        { id: 'payments', label: 'Payments', icon: CreditCard },
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3 },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'customers', label: 'User Management', icon: ShieldAlert },
        { id: 'dashboard', label: 'Settings', icon: Settings },
      ]
    }
  ];

  // Customer Portal navigation
  const customerGroups = [
    {
      title: 'PORTAL',
      items: [
        { id: 'portal', label: 'Overview', icon: Building2 },
        { id: 'subscriptions', label: 'My Subscriptions', icon: Repeat },
        { id: 'invoices', label: 'My Invoices', icon: FileText },
        { id: 'quotations', label: 'My Quotations', icon: FileCheck2 },
        { id: 'payments', label: 'Payment History', icon: CreditCard },
      ]
    }
  ];

  const groups = isCustomer ? customerGroups : adminGroups;

  return (
    <aside className="w-60 bg-[#192030] text-slate-300 flex flex-col shrink-0 h-screen select-none border-r border-slate-800/80">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight font-mono">SubscriptIQ</span>
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#944a27] text-white tracking-wider">
                Subs... IQ
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Brightloop Soft...</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 px-3 uppercase">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={`${item.id}-${item.label}-${itemIdx}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#944a27] text-white shadow-sm shadow-[#944a27]/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-800/80 bg-[#141a27] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-700 shrink-0">
            {userName ? userName.charAt(0) : 'S'}
          </div>
          <div className="min-w-0 truncate">
            <p className="text-xs font-semibold text-white truncate">
              {userName || (userRole === 'admin' ? 'Administrator' : userRole === 'staff' ? 'Staff Member' : 'Customer Account')}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {userEmail || (userRole === 'admin' ? 'System Administrator' : userRole === 'staff' ? 'Billing Operations' : 'Client User')}
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out / Switch"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

    </aside>
  );
};
