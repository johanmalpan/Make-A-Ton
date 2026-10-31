import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  Repeat,
  FileSpreadsheet,
  FileText,
  CreditCard,
  Percent,
  Receipt,
  BarChart3,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  X,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { NavigationPath, UserRole } from '../../types';

interface SidebarProps {
  currentPath: NavigationPath;
  onNavigate: (path: NavigationPath) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userRole: UserRole;
  counts?: {
    subscriptions?: number;
    quotations?: number;
    invoices?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  userRole,
  counts = {},
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('Brightloop Software India');

  const workspaces = [
    { name: 'Brightloop Software India', tier: 'Primary Production Entity', active: true },
    { name: 'Brightloop Global Cloud Inc.', tier: 'Subsidiary Entity', active: false },
    { name: 'Brightloop Sandbox Dev', tier: 'Testing & QA Staging', active: false },
  ];

  interface NavItem {
    id: NavigationPath;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const adminNavGroups: NavGroup[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'plans', label: 'Plans', icon: Layers },
        { id: 'customers', label: 'Customers', icon: Users },
      ],
    },
    {
      title: 'BILLING',
      items: [
        {
          id: 'subscriptions',
          label: 'Subscriptions',
          icon: Repeat,
          badge: counts.subscriptions,
          badgeColor: 'bg-emerald-500/20 text-emerald-300',
        },
        {
          id: 'quotations',
          label: 'Quotations',
          icon: FileSpreadsheet,
          badge: counts.quotations,
          badgeColor: 'bg-amber-500/20 text-amber-300',
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: FileText,
          badge: counts.invoices,
          badgeColor: 'bg-rose-500/20 text-rose-300',
        },
        { id: 'payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'discounts', label: 'Discounts', icon: Percent },
        { id: 'taxes', label: 'Taxes', icon: Receipt },
      ],
    },
    {
      title: 'INSIGHTS & PORTAL',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'portal', label: 'Customer Portal', icon: UserCheck },
      ],
    },
  ];

  const customerNavGroups: NavGroup[] = [
    {
      title: 'CLIENT SELF-SERVICE',
      items: [
        { id: 'portal', label: 'My Subscriptions', icon: Repeat },
        { id: 'dashboard', label: 'Return to Admin Console', icon: ShieldCheck },
      ],
    },
  ];

  const groups = userRole === 'customer' ? customerNavGroups : adminNavGroups;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#101D2D] text-slate-200 border-r border-[#1e2f42] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1b2b3d]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#15966B] flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Repeat className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-lg tracking-tight text-white">SubscriptIQ</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Odoo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Brightloop Software</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-[#182a3e] border border-[#233a54] text-slate-200 hover:bg-[#1d334b] transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="text-left truncate">
                <div className="font-medium text-slate-100 truncate">{activeWorkspace}</div>
                <div className="text-[10px] text-slate-400">Production Ledger (INR)</div>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${workspaceMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#142334] border border-[#233a54] rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400 border-b border-[#233a54]/50">
                Switch Organization Workspace
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.name}
                  onClick={() => {
                    setActiveWorkspace(ws.name);
                    setWorkspaceMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1d334b] text-left transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-200">{ws.name}</div>
                    <div className="text-[10px] text-slate-400">{ws.tier}</div>
                  </div>
                  {activeWorkspace === ws.name && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-400/90">
              {group.title}
            </div>
            <nav className="space-y-0.5" aria-label={group.title}>
              {group.items.map((item) => {
                const isActive = currentPath === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#15966B] text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-[#18293c]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Tagline */}
      <div className="p-4 border-t border-[#1b2b3d] bg-[#0d1724]">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-300 font-medium leading-tight">
              Manage every subscription. Automate every billing cycle.
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
              <span>SubscriptIQ v2.0</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">Odoo Hackathon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
