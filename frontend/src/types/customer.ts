export type CustomerStatus = 'active' | 'churned' | 'prospect';
export type CustomerTier = 'Enterprise' | 'Growth' | 'Starter';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  taxId?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  tier: CustomerTier;
  status: CustomerStatus;
  creditLimit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
