export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RenewalRule = 'auto_renew' | 'manual_renew' | 'expire';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  billingCycle: BillingCycle;
  price: number;
  minQuantity: number;
  trialDays: number;
  availableFrom?: string;
  availableUntil?: string;
  renewalRule: RenewalRule;
  targetAudience: string;
  features: string[];
  status: 'active' | 'archived';
  productId?: string;
  createdAt: string;
  updatedAt: string;
}
