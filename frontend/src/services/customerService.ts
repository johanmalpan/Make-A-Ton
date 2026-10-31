import { Customer } from '../types/customer';
import { INITIAL_CUSTOMERS } from '../data/mockData';
import { api } from './api';

const STORAGE_KEY = 'subscriptiq_customers';

function loadFromStorage(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

function saveToStorage(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save customers to localStorage', err);
  }
}

export const customerService = {
  getAll(): Customer[] {
    const data = loadFromStorage();
    // Background sync with backend
    api.getCustomers()
      .then((remote: Customer[]) => {
        if (Array.isArray(remote) && remote.length > 0) {
          saveToStorage(remote);
        }
      })
      .catch(() => {
        // Backend offline, fallback to local storage
      });
    return data;
  },

  async fetchAll(): Promise<Customer[]> {
    try {
      const remote = await api.getCustomers();
      if (Array.isArray(remote) && remote.length > 0) {
        saveToStorage(remote);
        return remote;
      }
    } catch {
      // Fallback
    }
    return loadFromStorage();
  },

  getById(id: string): Customer | undefined {
    return loadFromStorage().find((c) => c.id === id);
  },

  create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const customers = loadFromStorage();
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newCustomer, ...customers];
    saveToStorage(updated);

    // Sync to backend
    api.createCustomer(newCustomer).catch((err) => {
      console.warn('Backend customer sync error:', err);
    });

    return newCustomer;
  },

  update(id: string, updates: Partial<Customer>): Customer | undefined {
    const customers = loadFromStorage();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const updatedCustomer = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    customers[index] = updatedCustomer;
    saveToStorage(customers);

    api.updateCustomer(id, updatedCustomer).catch((err) => {
      console.warn('Backend customer update sync error:', err);
    });

    return updatedCustomer;
  },

  delete(id: string): boolean {
    const customers = loadFromStorage();
    const filtered = customers.filter((c) => c.id !== id);
    if (filtered.length === customers.length) return false;
    saveToStorage(filtered);

    api.deleteCustomer(id).catch((err) => {
      console.warn('Backend customer delete sync error:', err);
    });

    return true;
  },
};
