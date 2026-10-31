/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { SubscriptionsView } from './components/views/SubscriptionsView';
import { InvoicesView } from './components/views/InvoicesView';
import { QuotationsView } from './components/views/QuotationsView';
import { PaymentsView } from './components/views/PaymentsView';
import { CustomersView } from './components/views/CustomersView';
import { CatalogView } from './components/views/CatalogView';
import { TaxesDiscountsView } from './components/views/TaxesDiscountsView';
import { ReportsView } from './components/views/ReportsView';
import { CustomerPortalView } from './components/views/CustomerPortalView';

import { InvoiceModal } from './components/modals/InvoiceModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { BillingRunnerModal } from './components/modals/BillingRunnerModal';
import { QuotationModal } from './components/modals/QuotationModal';
import { SubscriptionModal } from './components/modals/SubscriptionModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { LoginModal } from './components/modals/LoginModal';
import { AdminSetupView } from './components/views/AdminSetupView';
import { AuthView } from './components/views/AuthView';

import { api, getStoredToken, setStoredAuth, clearStoredAuth } from './services/api';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  // Modals state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceToPay, setInvoiceToPay] = useState<any>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [authLoading, setAuthLoading] = useState(true);

  // Key to trigger re-renders on child views when records update
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // Check auth session or platform setup status (No auto-login)
  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
          setCustomer(res.customer);
          setHasAdmin(true);
          if (res.user.role === 'customer') {
            setActiveSection('portal');
          }
          return;
        } catch (err) {
          console.warn('Stored token expired or invalid:', err);
          clearStoredAuth();
        }
      }

      // Check whether an administrator exists or not
      const setup = await api.getSetupStatus();
      setHasAdmin(setup.hasAdmin);
      setUser(null);
      setCustomer(null);
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setHasAdmin(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleAuthChange = () => {
    checkAuth();
    triggerRefresh();
  };

  const handleOpenPayment = (inv: any) => {
    setInvoiceToPay(inv);
  };

  const handleEditCustomer = (cust: any) => {
    setCustomerToEdit(cust);
    setShowCustomerModal(true);
  };

  const handleNewCustomer = () => {
    setCustomerToEdit(null);
    setShowCustomerModal(true);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#111927] flex flex-col items-center justify-center font-sans text-white">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#944a27] to-[#b85d32] flex items-center justify-center font-bold text-white shadow-lg shadow-[#944a27]/30 text-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Subscript<span className="text-[#e27d4c]">IQ</span>
              <span className="text-[10px] font-semibold bg-[#944a27]/40 text-[#f59e0b] px-2 py-0.5 rounded-full border border-[#944a27]/60">ENTERPRISE</span>
            </h1>
            <p className="text-xs text-slate-400">Subscription & Recurring Billing Management</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-[#944a27] border-t-transparent rounded-full animate-spin"></div>
          <span>Initializing workspace session...</span>
        </div>
      </div>
    );
  }

  // If no user is authenticated
  if (!user) {
    if (hasAdmin === false) {
      return <AdminSetupView onSuccess={checkAuth} />;
    }
    return <AuthView onSuccess={checkAuth} />;
  }

  return (
    <div className="h-screen bg-[#f8fafc] flex overflow-hidden font-sans selection:bg-[#944a27] selection:text-white">
      {/* Sidebar on left spanning full height */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userRole={user?.role}
        userName={user?.full_name}
        userEmail={user?.email}
        onLogout={() => {
          clearStoredAuth();
          handleAuthChange();
        }}
      />

      {/* Main Workspace Area on right with top Navbar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          user={user}
          customer={customer}
          onAuthChange={handleAuthChange}
          onOpenBillingModal={() => setShowBillingModal(true)}
          onOpenLoginModal={() => setShowLoginModal(true)}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {activeSection === 'dashboard' && (
            <DashboardView
              key={refreshKey}
              onOpenBillingModal={() => setShowBillingModal(true)}
              onOpenQuotationModal={() => setShowQuotationModal(true)}
              onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
              onOpenCustomerModal={handleNewCustomer}
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              setActiveSection={setActiveSection}
            />
          )}

          {activeSection === 'subscriptions' && (
            <SubscriptionsView
              key={refreshKey}
              onOpenNewSubscription={() => setShowSubscriptionModal(true)}
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              userRole={user?.role}
            />
          )}

          {activeSection === 'invoices' && (
            <InvoicesView
              key={refreshKey}
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              onOpenPayment={handleOpenPayment}
              onOpenBillingModal={() => setShowBillingModal(true)}
              userRole={user?.role}
            />
          )}

          {activeSection === 'quotations' && (
            <QuotationsView
              key={refreshKey}
              onOpenNewQuotation={() => setShowQuotationModal(true)}
              userRole={user?.role}
              onRefreshSubscriptions={triggerRefresh}
            />
          )}

          {activeSection === 'payments' && (
            <PaymentsView
              key={refreshKey}
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              userRole={user?.role}
            />
          )}

          {activeSection === 'customers' && (
            <CustomersView
              key={refreshKey}
              onOpenNewCustomer={handleNewCustomer}
              onEditCustomer={handleEditCustomer}
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              userRole={user?.role}
            />
          )}

          {activeSection === 'catalog' && (
            <CatalogView
              key={refreshKey}
              userRole={user?.role}
            />
          )}

          {activeSection === 'taxes-discounts' && (
            <TaxesDiscountsView
              key={refreshKey}
              userRole={user?.role}
            />
          )}

          {activeSection === 'reports' && (
            <ReportsView
              key={refreshKey}
            />
          )}

          {activeSection === 'portal' && (
            <CustomerPortalView
              key={refreshKey}
              customer={customer}
              user={user}
              onSelectInvoice={(id) => setSelectedInvoiceId(id)}
              onOpenPayment={handleOpenPayment}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {selectedInvoiceId && (
        <InvoiceModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          onOpenPayment={(inv) => {
            setSelectedInvoiceId(null);
            handleOpenPayment(inv);
          }}
          onInvoiceUpdated={triggerRefresh}
          userRole={user?.role}
        />
      )}

      {invoiceToPay && (
        <PaymentModal
          invoice={invoiceToPay}
          onClose={() => setInvoiceToPay(null)}
          onPaymentSuccess={triggerRefresh}
        />
      )}

      {showBillingModal && (
        <BillingRunnerModal
          onClose={() => setShowBillingModal(false)}
          onRunComplete={triggerRefresh}
          onViewInvoice={(id) => {
            setShowBillingModal(false);
            setSelectedInvoiceId(id);
          }}
        />
      )}

      {showQuotationModal && (
        <QuotationModal
          onClose={() => setShowQuotationModal(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          customerToEdit={customerToEdit}
          onClose={() => {
            setShowCustomerModal(false);
            setCustomerToEdit(null);
          }}
          onSuccess={triggerRefresh}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleAuthChange}
        />
      )}
    </div>
  );
}
