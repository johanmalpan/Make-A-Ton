/**
 * API Client for Brightloop Enterprise Subscription Platform
 * Connects frontend service layers to the Express / SQLite backend
 */

const TOKEN_KEY = 'brightloop_auth_token';
const USER_KEY = 'brightloop_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: any) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Failed to store auth session:', err);
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('Failed to clear auth session:', err);
  }
}

export function getStoredUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password?: string }) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  health: () =>
    apiFetch('/api/health'),

  // Customers
  getCustomers: () => apiFetch('/api/customers'),
  createCustomer: (data: any) =>
    apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) =>
    apiFetch(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) =>
    apiFetch(`/api/customers/${id}`, { method: 'DELETE' }),

  // Products & Plans
  getProducts: () => apiFetch('/api/products'),
  createProduct: (data: any) =>
    apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  getPlans: () => apiFetch('/api/plans'),
  createPlan: (data: any) =>
    apiFetch('/api/plans', { method: 'POST', body: JSON.stringify(data) }),

  // Subscriptions
  getSubscriptions: () => apiFetch('/api/subscriptions'),
  createSubscription: (data: any) =>
    apiFetch('/api/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscriptionStatus: (id: string, status: string) =>
    apiFetch(`/api/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Quotations
  getQuotations: () => apiFetch('/api/quotations'),
  createQuotation: (data: any) =>
    apiFetch('/api/quotations', { method: 'POST', body: JSON.stringify(data) }),
  convertQuotation: (id: string) =>
    apiFetch(`/api/quotations/${id}/convert`, { method: 'POST' }),

  // Invoices
  getInvoices: () => apiFetch('/api/invoices'),
  createInvoice: (data: any) =>
    apiFetch('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
  payInvoice: (id: string, paymentData: any) =>
    apiFetch(`/api/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(paymentData) }),

  // Payments
  getPayments: () => apiFetch('/api/payments'),

  // Metrics & Billing Runner
  getMetrics: () => apiFetch('/api/metrics'),
  runBillingCycle: () => apiFetch('/api/billing-cycle/run', { method: 'POST' }),
  getAuditLogs: () => apiFetch('/api/audit-logs'),
};
