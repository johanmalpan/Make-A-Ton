import { Payment } from '../types/payment';
import { INITIAL_PAYMENTS } from '../data/mockData';
import { invoiceService } from './invoiceService';
import { getInvoicePaymentState } from '../utils/calculations';

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

  /**
   * Financial summary metrics for dashboard & billing overviews
   */
  getFinancialOverview() {
    const allInvoices = invoiceService.getAll();
    const today = new Date().toISOString().split('T')[0];

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    for (const inv of allInvoices) {
      if (inv.status === 'cancelled') continue;

      totalBilled += inv.totalAmount;
      totalCollected += inv.paidAmount || 0;

      const { paymentState, outstandingBalance } = getInvoicePaymentState(
        inv.totalAmount,
        inv.paidAmount || 0,
        inv.dueDate,
        today
      );

      if (paymentState === 'OVERDUE') {
        totalOverdue += outstandingBalance;
        overdueCount += 1;
      }
    }

    return {
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalOutstanding: Math.round(Math.max(0, totalBilled - totalCollected) * 100) / 100,
      totalOverdue: Math.round(totalOverdue * 100) / 100,
      overdueCount
    };
  },

  delete(id: string): boolean {
    const payments = loadFromStorage();
    const filtered = payments.filter((p) => p.id !== id);
    if (filtered.length === payments.length) return false;
    saveToStorage(filtered);
    return true;
  },
};

// Aliases for compatibility
export const getAllPayments = paymentService.getAll;
export const getFinancialOverview = paymentService.getFinancialOverview;