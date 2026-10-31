import { Product } from '../types/product';
import { INITIAL_PRODUCTS } from '../data/mockData';

const STORAGE_KEY = 'subscriptiq_products';

function loadFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

function saveToStorage(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save products to localStorage', err);
  }
}

export const productService = {
  getAll(): Product[] {
    return loadFromStorage();
  },

  getById(id: string): Product | undefined {
    return loadFromStorage().find((p) => p.id === id);
  },

  create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = loadFromStorage();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newProduct, ...products];
    saveToStorage(updated);
    return newProduct;
  },

  update(id: string, updates: Partial<Product>): Product | undefined {
    const products = loadFromStorage();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    products[index] = updatedProduct;
    saveToStorage(products);
    return updatedProduct;
  },

  delete(id: string): boolean {
    const products = loadFromStorage();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
