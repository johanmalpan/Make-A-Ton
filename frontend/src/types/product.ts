export type ProductType = 'service' | 'software' | 'consumable' | 'storable';

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  type: ProductType;
  category: string;
  salesPrice: number;
  costPrice: number;
  description: string;
  notes?: string;
  variants: ProductVariant[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
