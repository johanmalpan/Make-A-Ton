export * from './product';
export * from './plan';
export * from './customer';
export * from './subscription';
export * from './quotation';
export * from './invoice';
export * from './payment';

export type UserRole = 'admin' | 'billing_manager' | 'customer';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customerId?: string; // If customer role
  customerCompany?: string;
  avatarUrl?: string;
}

export type NavigationPath =
  | 'dashboard'
  | 'products'
  | 'plans'
  | 'customers'
  | 'subscriptions'
  | 'quotations'
  | 'invoices'
  | 'payments'
  | 'discounts'
  | 'taxes'
  | 'reports'
  | 'portal'
  | 'login'
  | 'not-found';

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  minOrderAmount?: number;
  status: 'active' | 'expired' | 'disabled';
  applicablePlanIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  code: string; // e.g. GST_18, GST_12, IGST_18
  rate: number;
  type: 'GST' | 'IGST' | 'CGST_SGST' | 'Exempt';
  isDefault: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}
