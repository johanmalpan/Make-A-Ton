import { Discount } from '../types';
import { INITIAL_DISCOUNTS } from '../data/mockData';

const STORAGE_KEY = 'subscriptiq_discounts';

function loadFromStorage(): Discount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DISCOUNTS));
      return INITIAL_DISCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DISCOUNTS;
  }
}

function saveToStorage(discounts: Discount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(discounts));
  } catch (err) {
    console.error('Failed to save discounts to localStorage', err);
  }
}

export const discountService = {
  getAll(): Discount[] {
    return loadFromStorage();
  },

  getById(id: string): Discount | undefined {
    return loadFromStorage().find((d) => d.id === id);
  },

  getByCode(code: string): Discount | undefined {
    return loadFromStorage().find((d) => d.code.toUpperCase() === code.trim().toUpperCase());
  },

  create(data: Omit<Discount, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Discount {
    const discounts = loadFromStorage();
    const newDiscount: Discount = {
      ...data,
      code: data.code.toUpperCase().replace(/\s+/g, ''),
      usageCount: 0,
      id: `disc-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newDiscount, ...discounts];
    saveToStorage(updated);
    return newDiscount;
  },

  incrementUsage(id: string): boolean {
    const discounts = loadFromStorage();
    const index = discounts.findIndex((d) => d.id === id);
    if (index === -1) return false;

    discounts[index].usageCount += 1;
    if (discounts[index].usageCount >= discounts[index].usageLimit) {
      discounts[index].status = 'expired';
    }
    discounts[index].updatedAt = new Date().toISOString().split('T')[0];
    saveToStorage(discounts);
    return true;
  },

  delete(id: string): boolean {
    const discounts = loadFromStorage();
    const filtered = discounts.filter((d) => d.id !== id);
    if (filtered.length === discounts.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
