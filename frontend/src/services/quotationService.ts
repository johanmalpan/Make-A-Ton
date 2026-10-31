import { Quotation, QuotationStatus } from '../types/quotation';
import { Subscription } from '../types/subscription';
import { INITIAL_QUOTATIONS } from '../data/mockData';
import { subscriptionService } from './subscriptionService';
import { addYears, addMonths } from '../utils/formatDate';
import { api } from './api';

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
    const data = loadFromStorage();
    api.getQuotations()
      .then((remote: Quotation[]) => {
        if (Array.isArray(remote) && remote.length > 0) {
          saveToStorage(remote);
        }
      })
      .catch(() => {});
    return data;
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

    api.createQuotation(newQuote).catch((err) => {
      console.warn('Backend quotation sync error:', err);
    });

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

  convertToSubscription(id: string): Subscription | undefined {
    const quotations = loadFromStorage();
    const index = quotations.findIndex((q) => q.id === id);
    if (index === -1) return undefined;

    const quote = quotations[index];
    const today = new Date().toISOString().split('T')[0];
    const expiry = quote.billingCycle === 'yearly' ? addYears(today, 1) : addMonths(today, 1);

    const newSub = subscriptionService.create({
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerCompany: quote.customerCompany,
      customerEmail: quote.customerEmail,
      planId: quote.planId,
      planName: quote.planName,
      billingCycle: quote.billingCycle,
      startDate: today,
      expiryDate: expiry,
      nextRenewalDate: expiry,
      lineItems: quote.lineItems,
      quantity: 1,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      autoRenew: true,
      status: 'active',
      paymentMethod: 'NetBanking',
      notes: `Converted from Quotation ${quote.quotationNumber}`,
    });

    quotations[index].status = 'accepted';
    quotations[index].convertedSubscriptionId = newSub.id;
    quotations[index].updatedAt = today;
    saveToStorage(quotations);

    api.convertQuotation(id).catch((err) => {
      console.warn('Backend convert quotation sync error:', err);
    });

    return newSub;
  },

  delete(id: string): boolean {
    const quotations = loadFromStorage();
    const filtered = quotations.filter((q) => q.id !== id);
    if (filtered.length === quotations.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
