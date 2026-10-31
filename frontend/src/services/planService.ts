import { SubscriptionPlan } from '../types/plan';
import { INITIAL_PLANS } from '../data/mockData';

const STORAGE_KEY = 'subscriptiq_plans';

function loadFromStorage(): SubscriptionPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PLANS));
      return INITIAL_PLANS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PLANS;
  }
}

function saveToStorage(plans: SubscriptionPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Failed to save plans to localStorage', err);
  }
}

export const planService = {
  getAll(): SubscriptionPlan[] {
    return loadFromStorage();
  },

  getById(id: string): SubscriptionPlan | undefined {
    return loadFromStorage().find((p) => p.id === id);
  },

  create(planData: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): SubscriptionPlan {
    const plans = loadFromStorage();
    const newPlan: SubscriptionPlan = {
      ...planData,
      id: `plan-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newPlan, ...plans];
    saveToStorage(updated);
    return newPlan;
  },

  update(id: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan | undefined {
    const plans = loadFromStorage();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const updatedPlan = {
      ...plans[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    plans[index] = updatedPlan;
    saveToStorage(plans);
    return updatedPlan;
  },

  delete(id: string): boolean {
    const plans = loadFromStorage();
    const filtered = plans.filter((p) => p.id !== id);
    if (filtered.length === plans.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
