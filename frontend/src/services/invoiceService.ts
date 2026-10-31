import { Invoice, InvoiceStatus, SubscriptionToBill } from '../types/invoice';
import { Subscription } from '../types/subscription';
import { INITIAL_INVOICES } from '../data/mockData';
import { calculateOutstandingBalance } from '../utils/calculations';
import { addDays } from '../utils/formatDate';
import { api } from './api';

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

export function hasDuplicateBilling(subscriptionId: string, billingDate: string): boolean {
  const invoices = loadFromStorage();
  return invoices.some(
    (inv) =>
      inv.subscriptionId === subscriptionId &&
      inv.issueDate === billingDate &&
      inv.status !== 'cancelled'
  );
}

export const invoiceService = {
  getAll(): Invoice[] {
    const data = loadFromStorage();
    api.getInvoices()
      .then((remote: Invoice[]) => {
        if (Array.isArray(remote) && remote.length > 0) {
          saveToStorage(remote);
        }
      })
      .catch(() => {});
    return data;
  },

  async fetchAll(): Promise<Invoice[]> {
    try {
      const remote = await api.getInvoices();
      if (Array.isArray(remote) && remote.length > 0) {
        saveToStorage(remote);
        return remote;
      }
    } catch {}
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
    const pad = String(count).padStart(4, '0');
    const year = new Date().getFullYear();
    const outstandingBalance = calculateOutstandingBalance(data.totalAmount, data.paidAmount || 0);

    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now().toString().slice(-6)}`,
      invoiceNumber: `INV/${year}/${pad}`,
      outstandingBalance,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newInvoice, ...invoices];
    saveToStorage(updated);

    api.createInvoice(newInvoice).catch((err) => {
      console.warn('Backend invoice create sync error:', err);
    });

    return newInvoice;
  },

  updateStatus(id: string, newStatus: InvoiceStatus): Invoice | undefined {
    const invoices = loadFromStorage();
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return undefined;

    invoices[index].status = newStatus;
    invoices[index].updatedAt = new Date().toISOString().split('T')[0];
    saveToStorage(invoices);
    return invoices[index];
  },

  recordPayment(id: string, amount: number, paymentMethod = 'UPI'): Invoice | undefined {
    const invoices = loadFromStorage();
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return undefined;

    const inv = invoices[index];
    const newPaidAmount = (inv.paidAmount || 0) + amount;
    const newOutstanding = calculateOutstandingBalance(inv.totalAmount, newPaidAmount);

    inv.paidAmount = newPaidAmount;
    inv.outstandingBalance = newOutstanding;
    inv.status = newOutstanding <= 0 ? 'paid' : 'partial';
    inv.updatedAt = new Date().toISOString().split('T')[0];

    saveToStorage(invoices);

    api.payInvoice(id, { amount, method: paymentMethod }).catch((err) => {
      console.warn('Backend payment record sync error:', err);
    });

    return inv;
  },

  generateForSubscription(subscription: Subscription): Invoice {
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = addDays(issueDate, 15);

    const invoiceItems = subscription.lineItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      description: `${subscription.planName} - ${item.productName}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: 18,
      taxAmount: Math.round(item.total * 0.18 * 100) / 100,
      total: Math.round(item.total * 1.18 * 100) / 100,
    }));

    return this.create({
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      customerId: subscription.customerId,
      customerName: subscription.customerName,
      customerCompany: subscription.customerCompany,
      customerEmail: subscription.customerEmail,
      issueDate,
      dueDate,
      items: invoiceItems,
      subtotal: subscription.subtotal,
      taxAmount: subscription.taxAmount,
      totalAmount: subscription.totalAmount,
      paidAmount: 0,
      status: 'posted',
      paymentTerms: 'Net 15 Days',
      notes: `Recurring billing for ${subscription.subscriptionNumber}`,
    });
  },

  createFromBillingEngine(bill: SubscriptionToBill): Invoice {
    const issueDate = bill.billingDate;
    const dueDate = addDays(issueDate, 15);

    let subtotal = 0;
    let taxAmount = 0;

    const invoiceItems = bill.lines.map((line, idx) => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineTax = (lineSubtotal * line.taxRatePercent) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        id: `item-${Date.now()}-${idx}`,
        description: line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRatePercent,
        taxAmount: Math.round(lineTax * 100) / 100,
        total: Math.round(lineTotal * 100) / 100,
      };
    });

    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    return this.create({
      subscriptionId: bill.id,
      customerId: bill.customerId,
      customerName: bill.customerName,
      customerCompany: bill.customerCompany || '',
      customerEmail: bill.customerEmail || '',
      issueDate,
      dueDate,
      items: invoiceItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountCode: bill.discountCode,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount,
      paidAmount: 0,
      status: 'posted',
      paymentTerms: 'Net 15 Days',
      notes: `Billing Engine Cycle: ${bill.billingDate}`,
    });
  },
};
