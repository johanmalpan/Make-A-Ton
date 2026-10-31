export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  subscriptionNumber?: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  paymentTerms: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Additions below for Member 3 Billing Logic ---

export type PaymentState = 'PAID' | 'UNPAID' | 'OVERDUE';
export type DiscountType = 'percentage' | 'fixed';

// Alias so calculation utilities can reference either name
export type InvoiceLine = InvoiceItem;

export interface DiscountRule {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minAmount?: number;
  minQuantity?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  timesUsed: number;
  isActive: boolean;
}

export interface SubscriptionToBill {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  billingDate: string;
  lines: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRatePercent: number;
  }[];
  discountCode?: string;
}