import { Subscription, SubscriptionStatus } from '../types/subscription';
import { INITIAL_SUBSCRIPTIONS } from '../data/mockData';

const STORAGE_KEY = 'subscriptiq_subscriptions';

function loadFromStorage(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBSCRIPTIONS));
      return INITIAL_SUBSCRIPTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUBSCRIPTIONS;
  }
}

function saveToStorage(subscriptions: Subscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (err) {
    console.error('Failed to save subscriptions to localStorage', err);
  }
}

export const subscriptionService = {
  getAll(): Subscription[] {
    return loadFromStorage();
  },

  getByCustomerId(customerId: string): Subscription[] {
    return loadFromStorage().filter((s) => s.customerId === customerId);
  },

  getById(id: string): Subscription | undefined {
    return loadFromStorage().find((s) => s.id === id);
  },

  create(subData: Omit<Subscription, 'id' | 'subscriptionNumber' | 'createdAt' | 'updatedAt'>): Subscription {
    const subscriptions = loadFromStorage();
    const count = subscriptions.length + 1;
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`;
    const newSubscription: Subscription = {
      ...subData,
      id: `sub-${Date.now().toString().slice(-5)}`,
      subscriptionNumber: `SUB/2026/${pad}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newSubscription, ...subscriptions];
    saveToStorage(updated);
    return newSubscription;
  },

  updateStatus(id: string, newStatus: SubscriptionStatus): Subscription | undefined {
    const subscriptions = loadFromStorage();
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    subscriptions[index].status = newStatus;
    subscriptions[index].updatedAt = new Date().toISOString().split('T')[0];
    saveToStorage(subscriptions);
    return subscriptions[index];
  },

  update(id: string, updates: Partial<Subscription>): Subscription | undefined {
    const subscriptions = loadFromStorage();
    const index = subscriptions.findIndex((s) => s.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...subscriptions[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    subscriptions[index] = updated;
    saveToStorage(subscriptions);
    return updated;
  },

  delete(id: string): boolean {
    const subscriptions = loadFromStorage();
    const filtered = subscriptions.filter((s) => s.id !== id);
    if (filtered.length === subscriptions.length) return false;
    saveToStorage(filtered);
    return true;
  },
};
