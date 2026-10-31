import { BillingCycle } from './plan';

export type SubscriptionStatus = 'draft' | 'active' | 'in_trial' | 'pending' | 'past_due' | 'cancelled' | 'expired';

export interface SubscriptionLineItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  startDate: string;
  expiryDate: string;
  nextRenewalDate: string;
  lineItems: SubscriptionLineItem[];
  quantity: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  autoRenew: boolean;
  status: SubscriptionStatus;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
