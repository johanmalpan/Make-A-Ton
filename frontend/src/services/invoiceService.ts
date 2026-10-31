import { Invoice, InvoiceStatus } from '../types/invoice';
import { Subscription } from '../types/subscription';
import { INITIAL_INVOICES } from '../data/mockData';
import { calculateOutstandingBalance } from '../utils/calculations';
import { addDays } from '../utils/formatDate';

const STORAGE_KEY = 'subscriptiq_invoices';

function loadFromStorage(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INVOICES;
  }
}

function saveToStorage(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.error('Failed to save invoices to localStorage', err);
  }
}

export const invoiceService = {
  getAll(): Invoice[] {
    return loadFromStorage();
  },

  getByCustomerId(customerId: string): Invoice[] {
    return loadFromStorage().filter((inv) => inv.customerId === customerId);
  },

  getById(id: string): Invoice | undefined {
    return loadFromStorage().find((inv) => inv.id === id);
  },

  create(data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'outstandingBalance'>): Invoice {
    const invoices = loadFromStorage();
    const count = invoices.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const outstandingBalance = calculateOutstandingBalance(data.totalAmount, data.paidAmount || 0);

    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now().toString().slice(-5)}`,
      invoiceNumber: `INV/2026/00${pad}`,
      outstandingBalance,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newInvoice, ...invoices];
    saveToStorage(updated);
    return newInvoice;
  },

  /**
   * Generates a new recurring cycle invoice from an active subscription
   */
  createFromSubscription(subscription: Subscription): Invoice {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = addDays(today, 15);

    return this.create({
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      customerId: subscription.customerId,
      customerName: subscription.customerName,
      customerCompany: subscription.customerCompany,
      customerEmail: subscription.customerEmail,
      issueDate: today,
      dueDate,
      items: subscription.lineItems.map((item, idx) => ({
        id: `inv-item-${Date.now()}-${idx}`,
        description: `${item.productName} — ${subscription.billingCycle} cycle`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: 18,
        taxAmount: (item.total * 18) / 100,
        total: item.total * 1.18,
      })),
      subtotal: subscription.subtotal,
      taxAmount: subscription.taxAmount,
      totalAmount: subscription.totalAmount,
      paidAmount: 0,
      status: 'posted',
      paymentTerms: 'Net 15 Days',
      notes: `Recurring cycle for ${subscription.subscriptionNumber}`,
    });
  },

  updateStatus(id: string, status: InvoiceStatus): Invoice | undefined {
    const invoices = loadFromStorage();
    const index = invoices.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    invoices[index].status = status;
    invoices[index].updatedAt = new Date().toISOString().split('T')[0];
    saveToStorage(invoices);
    return invoices[index];
  },

  recordPayment(id: string, paymentAmount: number): Invoice | undefined {
    const invoices = loadFromStorage();
    const index = invoices.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    const invoice = invoices[index];
    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    const newOutstanding = calculateOutstandingBalance(invoice.totalAmount, newPaidAmount);
    const newStatus: InvoiceStatus = newOutstanding <= 0 ? 'paid' : 'partial';

    const updated: Invoice = {
      ...invoice,
      paidAmount: newPaidAmount,
      outstandingBalance: newOutstanding,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    invoices[index] = updated;
    saveToStorage(invoices);
    return updated;
  },

  update(id: string, updates: Partial<Invoice>): Invoice | undefined {
    const invoices = loadFromStorage();
    const index = invoices.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...invoices[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    invoices[index] = updated;
    saveToStorage(invoices);
    return updated;
  },

  delete(id: string): boolean {
    const invoices = loadFromStorage();
    const filtered = invoices.filter((i) => i.id !== id);
    if (filtered.length === invoices.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
