/**
 * Client API Service with automatic JWT injection and typed responses
 */

const TOKEN_KEY = 'subscriptiq_token';
const USER_KEY = 'subscriptiq_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: any, customer?: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ user, customer }));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): { user: any; customer: any } | null {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const isPublicAuthEndpoint =
    endpoint.startsWith('/api/auth/login') ||
    endpoint.startsWith('/api/auth/register') ||
    endpoint.startsWith('/api/auth/forgot-password') ||
    endpoint.startsWith('/api/auth/reset-password') ||
    endpoint.startsWith('/api/auth/setup-status') ||
    endpoint.startsWith('/api/auth/bootstrap-admin') ||
    endpoint === '/api/health';

  const token = getStoredToken();
  if (!token && !isPublicAuthEndpoint) {
    throw new Error('Authentication required. No token provided.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return apiFetch<T>(endpoint, options, retries - 1);
    }
    throw err;
  }

  if (res.status === 401 && !isPublicAuthEndpoint) {
    clearStoredAuth();
    throw new Error('Authentication session expired or invalid. Please sign in again.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// -------------------------------------------------------------
// API METHODS
// -------------------------------------------------------------

export const api = {
  // Auth & Bootstrap
  getSetupStatus: () => apiFetch<{ hasAdmin: boolean }>('/api/auth/setup-status'),

  bootstrapAdmin: (data: { email: string; password: string; full_name: string }) => apiFetch('/api/auth/bootstrap-admin', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (email: string, password: string) => apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  register: (data: { email: string; password: string; full_name: string; company?: string; phone?: string; billing_address?: string }) => apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  forgotPassword: (email: string) => apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  resetPassword: (token: string, new_password: string) => apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password }),
  }),

  getCurrentUser: () => apiFetch('/api/auth/me'),

  // Staff Management (Admin only)
  getStaff: () => apiFetch('/api/staff'),
  createStaff: (data: { email: string; password: string; full_name: string }) => apiFetch('/api/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Customers
  getCustomers: () => apiFetch('/api/customers'),
  getCustomer: (id: string) => apiFetch(`/api/customers/${id}`),
  createCustomer: (data: any) => apiFetch('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCustomer: (id: string, data: any) => apiFetch(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Products & Variants
  getProducts: () => apiFetch('/api/products'),
  createProduct: (data: any) => apiFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteProduct: (id: string) => apiFetch(`/api/products/${id}`, {
    method: 'DELETE',
  }),
  createVariant: (productId: string, data: any) => apiFetch(`/api/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Plans
  getPlans: () => apiFetch('/api/plans'),
  createPlan: (data: any) => apiFetch('/api/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Taxes & Discounts
  getTaxes: () => apiFetch('/api/taxes'),
  createTax: (data: any) => apiFetch('/api/taxes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getDiscounts: () => apiFetch('/api/discounts'),
  createDiscount: (data: any) => apiFetch('/api/discounts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  validateDiscount: (discount_id: string, subtotal: number, quantity: number) => apiFetch('/api/discounts/validate', {
    method: 'POST',
    body: JSON.stringify({ discount_id, subtotal, quantity }),
  }),

  // Quotation Templates
  getTemplates: () => apiFetch('/api/quotation-templates'),
  createTemplate: (data: any) => apiFetch('/api/quotation-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteTemplate: (id: string) => apiFetch(`/api/quotation-templates/${id}`, {
    method: 'DELETE',
  }),

  // Quotations
  getQuotations: () => apiFetch('/api/quotations'),
  getQuotation: (id: string) => apiFetch(`/api/quotations/${id}`),
  createQuotation: (data: any) => apiFetch('/api/quotations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateQuotationStatus: (id: string, status: string) => apiFetch(`/api/quotations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  convertQuotation: (id: string) => apiFetch(`/api/quotations/${id}/convert`, {
    method: 'POST',
  }),

  // Subscriptions Lifecycle
  getSubscriptions: () => apiFetch('/api/subscriptions'),
  getSubscription: (id: string) => apiFetch(`/api/subscriptions/${id}`),
  createSubscription: (data: any) => apiFetch('/api/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirmSubscription: (id: string) => apiFetch(`/api/subscriptions/${id}/confirm`, {
    method: 'POST',
  }),
  activateSubscription: (id: string) => apiFetch(`/api/subscriptions/${id}/activate`, {
    method: 'POST',
  }),
  pauseSubscription: (id: string, reason: string) => apiFetch(`/api/subscriptions/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  resumeSubscription: (id: string) => apiFetch(`/api/subscriptions/${id}/resume`, {
    method: 'POST',
  }),
  closeSubscription: (id: string, reason: string) => apiFetch(`/api/subscriptions/${id}/close`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  cancelSubscription: (id: string, reason: string) => apiFetch(`/api/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  renewSubscription: (id: string) => apiFetch(`/api/subscriptions/${id}/renew`, {
    method: 'POST',
  }),

  // Invoices & Billing
  getInvoices: () => apiFetch('/api/invoices'),
  getInvoice: (id: string) => apiFetch(`/api/invoices/${id}`),
  confirmInvoice: (id: string) => apiFetch(`/api/invoices/${id}/confirm`, {
    method: 'PUT',
  }),
  voidInvoice: (id: string) => apiFetch(`/api/invoices/${id}/void`, {
    method: 'PUT',
  }),
  runBillingCycle: (force = false) => apiFetch('/api/billing/run-cycle', {
    method: 'POST',
    body: JSON.stringify({ force }),
  }),

  // Payments
  getPayments: () => apiFetch('/api/payments'),
  recordPayment: (data: any) => apiFetch('/api/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  reversePayment: (id: string, reason: string) => apiFetch(`/api/payments/${id}/reverse`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  // Financial Reports & Analytics
  getFinancialReport: () => apiFetch('/api/reports/financial'),
  getAuditLogs: () => apiFetch('/api/audit-logs'),
};
