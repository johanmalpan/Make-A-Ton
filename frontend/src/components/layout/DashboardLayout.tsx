import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NavigationPath, UserSession } from '../../types';
import { GlobalSearchModal } from './GlobalSearchModal';
import { Subscription, Invoice, Customer, SubscriptionPlan } from '../../types';

interface DashboardLayoutProps {
  currentPath: NavigationPath;
  userSession: UserSession;
  onNavigate: (path: NavigationPath) => void;
  onSwitchRole: (role: 'admin' | 'customer') => void;
  onLogout: () => void;
  children: React.ReactNode;
  subscriptions: Subscription[];
  invoices: Invoice[];
  customers: Customer[];
  plans: SubscriptionPlan[];
  onSelectSubscription: (sub: Subscription) => void;
  onSelectInvoice: (inv: Invoice) => void;
  counts?: {
    subscriptions?: number;
    quotations?: number;
    invoices?: number;
  };
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentPath,
  userSession,
  onNavigate,
  onSwitchRole,
  onLogout,
  children,
  subscriptions,
  invoices,
  customers,
  plans,
  onSelectSubscription,
  onSelectInvoice,
  counts,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        userRole={userSession.role}
        counts={counts}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          currentPath={currentPath}
          userSession={userSession}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenSearchModal={() => setSearchOpen(true)}
          onNavigate={onNavigate}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        subscriptions={subscriptions}
        invoices={invoices}
        customers={customers}
        plans={plans}
        onSelectSubscription={(sub) => {
          onSelectSubscription(sub);
          onNavigate('subscriptions');
        }}
        onSelectInvoice={(inv) => {
          onSelectInvoice(inv);
          onNavigate('invoices');
        }}
        onSelectCustomer={(cust) => {
          onNavigate('customers');
        }}
        onSelectPlan={(plan) => {
          onNavigate('plans');
        }}
      />
    </div>
  );
};
