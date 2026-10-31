import { BillingCycle } from './plan';
import { SubscriptionLineItem } from './subscription';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  lineItems: SubscriptionLineItem[];
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  validityDate: string;
  status: QuotationStatus;
  terms?: string;
  notes?: string;
  convertedSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}
