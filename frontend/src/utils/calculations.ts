import { BillingCycle } from '../types/plan';
import { InvoiceItem, DiscountRule, PaymentState } from '../types/invoice';

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

// --- Billing Helpers for Member 3 ---

/**
 * Builds an InvoiceItem with subtotal, tax, and item total
 */
export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  taxRatePercent: number,
  description: string = 'Subscription Service'
): InvoiceItem {
  const lineSubtotal = Math.round(quantity * unitPrice * 100) / 100;
  const taxAmount = Math.round(((lineSubtotal * taxRatePercent) / 100) * 100) / 100;
  const total = Math.round((lineSubtotal + taxAmount) * 100) / 100;

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    description,
    quantity,
    unitPrice,
    taxRate: taxRatePercent,
    taxAmount,
    total
  };
}

/**
 * Computes invoice summary with discount rules and effective tax
 */
export function calculateInvoiceSummary(
  items: InvoiceItem[],
  discountRule?: DiscountRule,
  currentDate: string = new Date().toISOString().split('T')[0]
) {
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  let discountAmount = 0;

  if (discountRule && discountRule.isActive) {
    const isDateValid =
      (!discountRule.startDate || currentDate >= discountRule.startDate) &&
      (!discountRule.endDate || currentDate <= discountRule.endDate);
    const isAmountValid = !discountRule.minAmount || subtotal >= discountRule.minAmount;
    const isQuantityValid = !discountRule.minQuantity || totalQuantity >= discountRule.minQuantity;
    const isUsageValid = !discountRule.maxUses || discountRule.timesUsed < discountRule.maxUses;

    if (isDateValid && isAmountValid && isQuantityValid && isUsageValid) {
      if (discountRule.type === 'percentage') {
        discountAmount = (subtotal * discountRule.value) / 100;
      } else {
        discountAmount = discountRule.value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedDiscount = Math.round(discountAmount * 100) / 100;
  const taxableBase = Math.max(0, roundedSubtotal - roundedDiscount);

  const effectiveTaxRate =
    items.length > 0
      ? items.reduce((sum, item) => sum + item.taxRate, 0) / items.length
      : 0;

  const taxAmount = Math.round(((taxableBase * effectiveTaxRate) / 100) * 100) / 100;
  const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    discountAmount: roundedDiscount,
    taxAmount,
    totalAmount
  };
}

/**
 * Determines whether an invoice is PAID, UNPAID, or OVERDUE
 */
export function getInvoicePaymentState(
  totalAmount: number,
  paidAmount: number,
  dueDate: string,
  currentDate: string = new Date().toISOString().split('T')[0]
): { paymentState: PaymentState; outstandingBalance: number } {
  const outstandingBalance = calculateOutstandingBalance(totalAmount, paidAmount);

  if (outstandingBalance === 0) {
    return { paymentState: 'PAID', outstandingBalance: 0 };
  }

  if (currentDate > dueDate) {
    return { paymentState: 'OVERDUE', outstandingBalance };
  }

  return { paymentState: 'UNPAID', outstandingBalance };
}