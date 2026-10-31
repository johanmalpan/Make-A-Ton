import { BillingCycle } from '../types/plan';
import { InvoiceItem } from '../types/invoice';

/**
 * Normalizes any billing cycle into standard Monthly Recurring Revenue (MRR)
 */
export function normalizeToMRR(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return (amount * 52) / 12;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Normalizes any billing cycle into Annual Recurring Revenue (ARR)
 */
export function normalizeToARR(amount: number, cycle: BillingCycle): number {
  return normalizeToMRR(amount, cycle) * 12;
}

/**
 * Calculates line items subtotal, tax and total
 */
export function calculateTotals(
  items: Array<{ quantity: number; unitPrice: number; taxRate?: number }>,
  discountPercentage = 0,
  defaultTaxRate = 18 // Standard GST 18%
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxAmount = 0;
  items.forEach((item) => {
    const rate = item.taxRate !== undefined ? item.taxRate : defaultTaxRate;
    const itemNet = item.quantity * item.unitPrice * (1 - discountPercentage / 100);
    taxAmount += (itemNet * rate) / 100;
  });

  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Computes outstanding balance on an invoice after payments
 */
export function calculateOutstandingBalance(totalAmount: number, paidAmount: number): number {
  const balance = totalAmount - paidAmount;
  return balance <= 0 ? 0 : Math.round(balance * 100) / 100;
}
