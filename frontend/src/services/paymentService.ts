import { Payment } from '../types/payment';
import { INITIAL_PAYMENTS } from '../data/mockData';
import { invoiceService } from './invoiceService';
import { getInvoicePaymentState } from '../utils/calculations';
import { api } from './api';

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
    const data = loadFromStorage();
    api.getPayments()
      .then((remote: Payment[]) => {
        if (Array.isArray(remote) && remote.length > 0) {
          saveToStorage(remote);
        }
      })
      .catch(() => {});
    return data;
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

    const updated = [newPayment, ...payments];
    saveToStorage(updated);

    invoiceService.recordPayment(data.invoiceId, data.amount, data.method);
    return newPayment;
  },

  getTotalPaidForInvoice(invoiceId: string): number {
    return this.getByInvoiceId(invoiceId)
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);
  },

  getPaymentState(invoiceTotal: number, invoiceId: string) {
    const totalPaid = this.getTotalPaidForInvoice(invoiceId);
    return getInvoicePaymentState(invoiceTotal, totalPaid);
  },

  delete(id: string): boolean {
    const payments = loadFromStorage();
    const filtered = payments.filter((p) => p.id !== id);
    if (filtered.length === payments.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
