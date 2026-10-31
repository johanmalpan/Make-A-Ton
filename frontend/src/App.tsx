/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  NavigationPath,
  UserSession,
  UserRole,
  Subscription,
  Invoice,
  Customer,
  SubscriptionPlan,
  Product,
  Quotation,
  Payment,
} from './types';

// Services
import { subscriptionService } from './services/subscriptionService';
import { invoiceService } from './services/invoiceService';
import { customerService } from './services/customerService';
import { productService } from './services/productService';
import { planService } from './services/planService';
import { paymentService } from './services/paymentService';
import { quotationService } from './services/quotationService';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Customers } from './pages/Customers';
import { Subscriptions } from './pages/Subscriptions';
import { Quotations } from './pages/Quotations';
import { Invoices } from './pages/Invoices';
import { Payments } from './pages/Payments';
import { Discounts } from './pages/Discounts';
import { Taxes } from './pages/Taxes';
import { Reports } from './pages/Reports';
import { CustomerPortal } from './pages/CustomerPortal';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

// Modals
import { SubscriptionDetailModal } from './components/modals/SubscriptionDetailModal';
import { InvoiceDetailModal } from './components/modals/InvoiceDetailModal';
import { SubscriptionForm } from './components/subscriptions/SubscriptionForm';
import { PaymentForm } from './components/payments/PaymentForm';

export default function App() {
  // Navigation & User Session
  const [currentPath, setCurrentPath] = useState<NavigationPath>('dashboard');
  const [userSession, setUserSession] = useState<UserSession>({
    id: 'user-01',
    name: 'Brightloop Admin',
    email: 'admin@brightloop.io',
    role: 'admin',
  });

  // State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Modals state
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState<Invoice | null>(null);

  // Load all data from service layer
  const reloadData = useCallback(() => {
    setSubscriptions(subscriptionService.getAll());
    setInvoices(invoiceService.getAll());
    setCustomers(customerService.getAll());
    setPlans(planService.getAll());
    setProducts(productService.getAll());
    setQuotations(quotationService.getAll());
    setPayments(paymentService.getAll());
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Role switching
  const handleSwitchRole = (role: 'admin' | 'customer') => {
    if (role === 'customer') {
      const firstCust = customers[0];
      setUserSession({
        id: 'cust-user-01',
        name: firstCust?.name || 'Rajesh K. Sharma',
        email: firstCust?.email || 'rajesh.sharma@apexlogistics.in',
        role: 'customer',
        customerId: firstCust?.id || 'cust-201',
        customerCompany: firstCust?.company || 'Apex Logistics India Ltd',
      });
      setCurrentPath('portal');
    } else {
      setUserSession({
        id: 'user-01',
        name: 'Brightloop Admin',
        email: 'admin@brightloop.io',
        role: 'admin',
      });
      setCurrentPath('dashboard');
    }
  };

  const handleLogin = (role: UserRole, customerId?: string) => {
    if (role === 'customer') {
      const cust = customers.find(c => c.id === customerId) || customers[0];
      setUserSession({
        id: 'cust-user-01',
        name: cust?.name || 'Rajesh K. Sharma',
        email: cust?.email || 'rajesh.sharma@apexlogistics.in',
        role: 'customer',
        customerId: cust?.id || 'cust-201',
        customerCompany: cust?.company || 'Apex Logistics India Ltd',
      });
      setCurrentPath('portal');
    } else {
      setUserSession({
        id: 'user-01',
        name: 'Brightloop Admin',
        email: 'admin@brightloop.io',
        role: 'admin',
      });
      setCurrentPath('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentPath('login');
  };

  // Actions
  const handleSendReminder = (invoice: Invoice) => {
    alert(`Dunning collection notice dispatched to ${invoice.customerEmail} for Invoice ${invoice.invoiceNumber}.`);
  };

  const handleOpenRecordPayment = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setRecordPaymentInvoice(inv);
    }
  };

  const handleSavePayment = (data: {
    invoiceId: string;
    amount: number;
    method: any;
    referenceNumber: string;
    notes?: string;
  }) => {
    const inv = invoices.find(i => i.id === data.invoiceId);
    if (!inv) return;

    paymentService.create({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerCompany: inv.customerCompany,
      amount: data.amount,
      method: data.method,
      referenceNumber: data.referenceNumber,
      status: 'succeeded',
      paymentDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      notes: data.notes,
    });

    reloadData();
    setRecordPaymentInvoice(null);
  };

  const handleSaveNewSubscription = (data: Omit<Subscription, 'id' | 'subscriptionNumber' | 'createdAt' | 'updatedAt'>) => {
    subscriptionService.create(data);
    reloadData();
    setIsSubscriptionFormOpen(false);
  };

  // Handle direct full-screen login
  if (currentPath === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // Count badges for sidebar
  const counts = {
    subscriptions: subscriptions.filter(s => s.status === 'active').length,
    quotations: quotations.filter(q => q.status === 'sent' || q.status === 'draft').length,
    invoices: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length,
  };

  return (
    <DashboardLayout
      currentPath={currentPath}
      userSession={userSession}
      onNavigate={setCurrentPath}
      onSwitchRole={handleSwitchRole}
      onLogout={handleLogout}
      subscriptions={subscriptions}
      invoices={invoices}
      customers={customers}
      plans={plans}
      onSelectSubscription={(sub) => {
        setSelectedSubscription(sub);
      }}
      onSelectInvoice={(inv) => {
        setSelectedInvoice(inv);
      }}
      counts={counts}
    >
      {/* 1. OVERVIEW DASHBOARD */}
      {currentPath === 'dashboard' && (
        <Dashboard
          subscriptions={subscriptions}
          invoices={invoices}
          customers={customers}
          onNavigate={setCurrentPath}
          onSelectSubscription={(sub) => setSelectedSubscription(sub)}
          onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          onOpenNewSubscription={() => setIsSubscriptionFormOpen(true)}
          onSendInvoiceReminder={handleSendReminder}
        />
      )}

      {/* 2. PRODUCTS */}
      {currentPath === 'products' && (
        <Products
          products={products}
          onRefresh={reloadData}
          onNavigateToPlans={() => setCurrentPath('plans')}
        />
      )}

      {/* 3. PLANS */}
      {currentPath === 'plans' && (
        <Plans
          plans={plans}
          products={products}
          onRefresh={reloadData}
          onSelectPlanToSubscribe={() => setIsSubscriptionFormOpen(true)}
        />
      )}

      {/* 4. CUSTOMERS */}
      {currentPath === 'customers' && (
        <Customers
          customers={customers}
          subscriptions={subscriptions}
          invoices={invoices}
          onRefresh={reloadData}
          onNavigateToSubscription={(sub) => {
            setSelectedSubscription(sub);
          }}
        />
      )}

      {/* 5. SUBSCRIPTIONS */}
      {currentPath === 'subscriptions' && (
        <Subscriptions
          subscriptions={subscriptions}
          customers={customers}
          plans={plans}
          products={products}
          onRefresh={reloadData}
          onSelectSubscription={(sub) => setSelectedSubscription(sub)}
          onNavigateToInvoices={() => setCurrentPath('invoices')}
        />
      )}

      {/* 6. QUOTATIONS */}
      {currentPath === 'quotations' && (
        <Quotations
          quotations={quotations}
          customers={customers}
          plans={plans}
          products={products}
          onRefresh={reloadData}
          onNavigateToSubscriptions={() => setCurrentPath('subscriptions')}
        />
      )}

      {/* 7. INVOICES */}
      {currentPath === 'invoices' && (
        <Invoices
          invoices={invoices}
          customers={customers}
          subscriptions={subscriptions}
          onRefresh={reloadData}
          onOpenRecordPayment={handleOpenRecordPayment}
          onSendReminder={handleSendReminder}
        />
      )}

      {/* 8. PAYMENTS */}
      {currentPath === 'payments' && (
        <Payments
          payments={payments}
          invoices={invoices}
          onRefresh={reloadData}
        />
      )}

      {/* 9. DISCOUNTS */}
      {currentPath === 'discounts' && <Discounts />}

      {/* 10. TAXES */}
      {currentPath === 'taxes' && <Taxes />}

      {/* 11. REPORTS */}
      {currentPath === 'reports' && <Reports />}

      {/* 12. CUSTOMER PORTAL */}
      {currentPath === 'portal' && <CustomerPortal />}

      {/* 13. NOT FOUND / UNKNOWN PATH */}
      {currentPath === 'not-found' && (
        <NotFound onNavigate={setCurrentPath} />
      )}

      {/* Modals */}
      {selectedSubscription && (
        <SubscriptionDetailModal
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
          onUpdateStatus={(subId, newStatus) => {
            subscriptionService.update(subId, { status: newStatus });
            reloadData();
            setSelectedSubscription(null);
          }}
          onViewCustomerInvoices={() => {
            setSelectedSubscription(null);
            setCurrentPath('invoices');
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onMarkAsPaid={(invId) => {
            invoiceService.update(invId, { status: 'paid', outstandingBalance: 0, paidAmount: selectedInvoice.totalAmount });
            reloadData();
            setSelectedInvoice(null);
          }}
          onSendReminder={handleSendReminder}
        />
      )}

      {isSubscriptionFormOpen && (
        <SubscriptionForm
          isOpen={isSubscriptionFormOpen}
          onClose={() => setIsSubscriptionFormOpen(false)}
          onSubmit={handleSaveNewSubscription}
          customers={customers}
          plans={plans}
          products={products}
        />
      )}

      {recordPaymentInvoice && (
        <PaymentForm
          isOpen={true}
          onClose={() => setRecordPaymentInvoice(null)}
          onSubmit={handleSavePayment}
          invoices={invoices}
          initialInvoiceId={recordPaymentInvoice.id}
        />
      )}
    </DashboardLayout>
  );
}
