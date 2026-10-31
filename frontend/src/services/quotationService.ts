import { Quotation, QuotationStatus } from '../types/quotation';
import { Subscription } from '../types/subscription';
import { INITIAL_QUOTATIONS } from '../data/mockData';
import { subscriptionService } from './subscriptionService';
import { addYears, addMonths } from '../utils/formatDate';

const STORAGE_KEY = 'subscriptiq_quotations';

function loadFromStorage(): Quotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUOTATIONS));
      return INITIAL_QUOTATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_QUOTATIONS;
  }
}

function saveToStorage(quotations: Quotation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
  } catch (err) {
    console.error('Failed to save quotations to localStorage', err);
  }
}

export const quotationService = {
  getAll(): Quotation[] {
    return loadFromStorage();
  },

  getById(id: string): Quotation | undefined {
    return loadFromStorage().find((q) => q.id === id);
  },

  create(data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Quotation {
    const quotations = loadFromStorage();
    const count = quotations.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const newQuote: Quotation = {
      ...data,
      id: `qt-${Date.now().toString().slice(-5)}`,
      quotationNumber: `SO/2026/00${pad}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newQuote, ...quotations];
    saveToStorage(updated);
    return newQuote;
  },

  updateStatus(id: string, status: QuotationStatus): Quotation | undefined {
    const quotations = loadFromStorage();
    const index = quotations.findIndex((q) => q.id === id);
    if (index === -1) return undefined;

    quotations[index].status = status;
    quotations[index].updatedAt = new Date().toISOString().split('T')[0];
    saveToStorage(quotations);
    return quotations[index];
  },

  /**
   * Odoo Hackathon workflow: Confirm quotation and convert directly into an active subscription!
   */
  confirmAndConvertToSubscription(id: string): { quotation: Quotation; subscription: Subscription } | undefined {
    const quotation = this.getById(id);
    if (!quotation) return undefined;

    const startDate = new Date().toISOString().split('T')[0];
    const expiryDate = quotation.billingCycle === 'yearly'
      ? addYears(startDate, 1)
      : addMonths(startDate, 1);

    const subscription = subscriptionService.create({
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerCompany: quotation.customerCompany,
      customerEmail: quotation.customerEmail,
      planId: quotation.planId,
      planName: quotation.planName,
      billingCycle: quotation.billingCycle,
      startDate,
      expiryDate,
      nextRenewalDate: expiryDate,
      lineItems: quotation.lineItems,
      quantity: quotation.lineItems.reduce((s, it) => s + it.quantity, 0) || 1,
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      autoRenew: true,
      status: 'active',
      paymentMethod: 'Bank Transfer / Invoice Net 15',
      notes: `Converted from Sales Order ${quotation.quotationNumber}`,
    });

    const updatedQuotation = this.update(id, {
      status: 'accepted',
      convertedSubscriptionId: subscription.id,
    });

    return updatedQuotation ? { quotation: updatedQuotation, subscription } : undefined;
  },

  update(id: string, updates: Partial<Quotation>): Quotation | undefined {
    const quotations = loadFromStorage();
    const index = quotations.findIndex((q) => q.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...quotations[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    quotations[index] = updated;
    saveToStorage(quotations);
    return updated;
  },

  delete(id: string): boolean {
    const quotations = loadFromStorage();
    const filtered = quotations.filter((q) => q.id !== id);
    if (filtered.length === quotations.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
