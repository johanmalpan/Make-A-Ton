import { Payment } from '../types/payment';
import { INITIAL_PAYMENTS } from '../data/mockData';
import { invoiceService } from './invoiceService';

const STORAGE_KEY = 'subscriptiq_payments';

function loadFromStorage(): Payment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PAYMENTS;
  }
}

function saveToStorage(payments: Payment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
  } catch (err) {
    console.error('Failed to save payments to localStorage', err);
  }
}

export const paymentService = {
  getAll(): Payment[] {
    return loadFromStorage();
  },

  getByInvoiceId(invoiceId: string): Payment[] {
    return loadFromStorage().filter((p) => p.invoiceId === invoiceId);
  },

  getByCustomerId(customerId: string): Payment[] {
    return loadFromStorage().filter((p) => p.customerId === customerId);
  },

  getById(id: string): Payment | undefined {
    return loadFromStorage().find((p) => p.id === id);
  },

  /**
   * Records a payment against an invoice and updates the invoice balance automatically
   */
  create(data: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt'>): Payment {
    const payments = loadFromStorage();
    const count = payments.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;

    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now().toString().slice(-5)}`,
      paymentNumber: `PAY/2026/00${pad}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // If payment succeeded, automatically update invoice balance!
    if (data.status === 'succeeded') {
      invoiceService.recordPayment(data.invoiceId, data.amount);
    }

    const updated = [newPayment, ...payments];
    saveToStorage(updated);
    return newPayment;
  },

  delete(id: string): boolean {
    const payments = loadFromStorage();
    const filtered = payments.filter((p) => p.id !== id);
    if (filtered.length === payments.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
