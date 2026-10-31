import { Router, Request, Response } from 'express';
import { getDatabase } from './db.js';
import { runAutomatedBillingCycle } from './billingEngine.js';

export const router = Router();

// Helper to parse JSON fields safely
function safeJson(val: any, defaultVal: any = []) {
  if (typeof val !== 'string') return val ?? defaultVal;
  try {
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Brightloop Subscription Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Authentication
// ----------------------------------------------------
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = getDatabase();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `token-${user.id}-${Date.now()}`;
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customer_id,
      customerCompany: user.customer_company,
      avatarUrl: user.avatar_url,
    },
  });
});

router.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role = 'billing_manager', customerCompany } = req.body;
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const id = `user-${Date.now().toString().slice(-6)}`;
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, customer_company, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email, password, role, customerCompany || null, new Date().toISOString());

  res.status(201).json({
    message: 'User registered successfully',
    user: { id, name, email, role, customerCompany },
  });
});

// ----------------------------------------------------
// Customers
// ----------------------------------------------------
router.get('/customers', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as any[];
  const customers = rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    email: r.email,
    phone: r.phone,
    taxId: r.tax_id,
    address: safeJson(r.address, {}),
    tier: r.tier,
    status: r.status,
    creditLimit: r.credit_limit,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(customers);
});

router.post('/customers', (req: Request, res: Response) => {
  const db = getDatabase();
  const c = req.body;
  const id = c.id || `cust-${Date.now().toString().slice(-5)}`;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO customers (id, name, company, email, phone, tax_id, address, tier, status, credit_limit, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    c.name,
    c.company,
    c.email,
    c.phone,
    c.taxId || '',
    JSON.stringify(c.address || {}),
    c.tier || 'Starter',
    c.status || 'active',
    c.creditLimit || 0,
    c.notes || '',
    c.createdAt || today,
    c.updatedAt || today
  );

  res.status(201).json({ id, ...c, createdAt: today, updatedAt: today });
});

router.put('/customers/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const c = req.body;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE customers SET
      name = COALESCE(?, name),
      company = COALESCE(?, company),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      tax_id = COALESCE(?, tax_id),
      address = COALESCE(?, address),
      tier = COALESCE(?, tier),
      status = COALESCE(?, status),
      credit_limit = COALESCE(?, credit_limit),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `).run(
    c.name,
    c.company,
    c.email,
    c.phone,
    c.taxId,
    c.address ? JSON.stringify(c.address) : null,
    c.tier,
    c.status,
    c.creditLimit,
    c.notes,
    today,
    id
  );

  res.json({ message: 'Customer updated' });
});

router.delete('/customers/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Customer deleted' });
});

// ----------------------------------------------------
// Products
// ----------------------------------------------------
router.get('/products', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as any[];
  const products = rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    type: r.type,
    category: r.category,
    salesPrice: r.sales_price,
    costPrice: r.cost_price,
    description: r.description,
    notes: r.notes,
    variants: safeJson(r.variants, []),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(products);
});

router.post('/products', (req: Request, res: Response) => {
  const db = getDatabase();
  const p = req.body;
  const id = p.id || `prod-${Date.now().toString().slice(-5)}`;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO products (id, name, code, type, category, sales_price, cost_price, description, notes, variants, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    p.name,
    p.code,
    p.type || 'service',
    p.category || 'General',
    p.salesPrice || 0,
    p.costPrice || 0,
    p.description || '',
    p.notes || '',
    JSON.stringify(p.variants || []),
    p.status || 'active',
    today,
    today
  );

  res.status(201).json({ id, ...p });
});

// ----------------------------------------------------
// Plans
// ----------------------------------------------------
router.get('/plans', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all() as any[];
  const plans = rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    billingCycle: r.billing_cycle,
    price: r.price,
    minQuantity: r.min_quantity,
    trialDays: r.trial_days,
    availableFrom: r.available_from,
    availableUntil: r.available_until,
    renewalRule: r.renewal_rule,
    targetAudience: r.target_audience,
    features: safeJson(r.features, []),
    status: r.status,
    productId: r.product_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(plans);
});

router.post('/plans', (req: Request, res: Response) => {
  const db = getDatabase();
  const pl = req.body;
  const id = pl.id || `plan-${Date.now().toString().slice(-5)}`;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO plans (id, name, code, description, billing_cycle, price, min_quantity, trial_days, available_from, available_until, renewal_rule, target_audience, features, status, product_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    pl.name,
    pl.code,
    pl.description || '',
    pl.billingCycle || 'monthly',
    pl.price || 0,
    pl.minQuantity || 1,
    pl.trialDays || 0,
    pl.availableFrom || null,
    pl.availableUntil || null,
    pl.renewalRule || 'auto_renew',
    pl.targetAudience || '',
    JSON.stringify(pl.features || []),
    pl.status || 'active',
    pl.productId || null,
    today,
    today
  );

  res.status(201).json({ id, ...pl });
});

// ----------------------------------------------------
// Subscriptions
// ----------------------------------------------------
router.get('/subscriptions', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC').all() as any[];
  const subscriptions = rows.map((r) => ({
    id: r.id,
    subscriptionNumber: r.subscription_number,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerCompany: r.customer_company,
    customerEmail: r.customer_email,
    planId: r.plan_id,
    planName: r.plan_name,
    billingCycle: r.billing_cycle,
    startDate: r.start_date,
    expiryDate: r.expiry_date,
    nextRenewalDate: r.next_renewal_date,
    lineItems: safeJson(r.line_items, []),
    quantity: r.quantity,
    subtotal: r.subtotal,
    taxAmount: r.tax_amount,
    totalAmount: r.total_amount,
    autoRenew: Boolean(r.auto_renew),
    status: r.status,
    paymentMethod: r.payment_method,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(subscriptions);
});

router.post('/subscriptions', (req: Request, res: Response) => {
  const db = getDatabase();
  const s = req.body;
  const count = (db.prepare('SELECT COUNT(*) as c FROM subscriptions').get() as any).c + 1;
  const pad = String(count).padStart(3, '0');
  const id = s.id || `sub-${Date.now().toString().slice(-5)}`;
  const subNumber = s.subscriptionNumber || `SUB/2026/${pad}`;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, customer_name, customer_company, customer_email,
      plan_id, plan_name, billing_cycle, start_date, expiry_date, next_renewal_date,
      line_items, quantity, subtotal, tax_amount, total_amount, auto_renew, status,
      payment_method, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    subNumber,
    s.customerId,
    s.customerName,
    s.customerCompany,
    s.customerEmail,
    s.planId,
    s.planName,
    s.billingCycle || 'monthly',
    s.startDate || today,
    s.expiryDate || today,
    s.nextRenewalDate || today,
    JSON.stringify(s.lineItems || []),
    s.quantity || 1,
    s.subtotal || 0,
    s.taxAmount || 0,
    s.totalAmount || 0,
    s.autoRenew !== false ? 1 : 0,
    s.status || 'active',
    s.paymentMethod || 'UPI',
    s.notes || '',
    today,
    today
  );

  res.status(201).json({ id, subscriptionNumber: subNumber, ...s });
});

router.patch('/subscriptions/:id/status', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { status } = req.body;
  const today = new Date().toISOString().split('T')[0];

  db.prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?').run(status, today, id);
  res.json({ message: 'Subscription status updated' });
});

// ----------------------------------------------------
// Quotations
// ----------------------------------------------------
router.get('/quotations', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM quotations ORDER BY created_at DESC').all() as any[];
  const quotations = rows.map((r) => ({
    id: r.id,
    quotationNumber: r.quotation_number,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerCompany: r.customer_company,
    customerEmail: r.customer_email,
    planId: r.plan_id,
    planName: r.plan_name,
    billingCycle: r.billing_cycle,
    lineItems: safeJson(r.line_items, []),
    subtotal: r.subtotal,
    discountPercentage: r.discount_percentage,
    discountAmount: r.discount_amount,
    taxAmount: r.tax_amount,
    totalAmount: r.total_amount,
    validityDate: r.validity_date,
    status: r.status,
    terms: r.terms,
    notes: r.notes,
    convertedSubscriptionId: r.converted_subscription_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(quotations);
});

router.post('/quotations', (req: Request, res: Response) => {
  const db = getDatabase();
  const q = req.body;
  const count = (db.prepare('SELECT COUNT(*) as c FROM quotations').get() as any).c + 1;
  const pad = String(count).padStart(3, '0');
  const id = q.id || `quot-${Date.now().toString().slice(-5)}`;
  const qNum = q.quotationNumber || `QT/2026/${pad}`;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO quotations (
      id, quotation_number, customer_id, customer_name, customer_company, customer_email,
      plan_id, plan_name, billing_cycle, line_items, subtotal, discount_percentage,
      discount_amount, tax_amount, total_amount, validity_date, status, terms, notes,
      converted_subscription_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    qNum,
    q.customerId,
    q.customerName,
    q.customerCompany,
    q.customerEmail,
    q.planId,
    q.planName,
    q.billingCycle || 'monthly',
    JSON.stringify(q.lineItems || []),
    q.subtotal || 0,
    q.discountPercentage || 0,
    q.discountAmount || 0,
    q.taxAmount || 0,
    q.totalAmount || 0,
    q.validityDate || today,
    q.status || 'draft',
    q.terms || '',
    q.notes || '',
    q.convertedSubscriptionId || null,
    today,
    today
  );

  res.status(201).json({ id, quotationNumber: qNum, ...q });
});

router.post('/quotations/:id/convert', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as any;
  if (!q) return res.status(404).json({ error: 'Quotation not found' });

  const count = (db.prepare('SELECT COUNT(*) as c FROM subscriptions').get() as any).c + 1;
  const pad = String(count).padStart(3, '0');
  const subId = `sub-from-quot-${Date.now().toString().slice(-5)}`;
  const subNum = `SUB/2026/${pad}`;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, customer_name, customer_company, customer_email,
      plan_id, plan_name, billing_cycle, start_date, expiry_date, next_renewal_date,
      line_items, quantity, subtotal, tax_amount, total_amount, auto_renew, status,
      payment_method, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    subId,
    subNum,
    q.customer_id,
    q.customer_name,
    q.customer_company,
    q.customer_email,
    q.plan_id,
    q.plan_name,
    q.billing_cycle,
    today,
    q.validity_date,
    today,
    q.line_items,
    1,
    q.subtotal,
    q.tax_amount,
    q.total_amount,
    1,
    'active',
    'NetBanking',
    `Converted from Quotation ${q.quotation_number}`,
    today,
    today
  );

  db.prepare(`
    UPDATE quotations 
    SET status = 'accepted', converted_subscription_id = ?, updated_at = ?
    WHERE id = ?
  `).run(subId, today, id);

  res.json({ message: 'Quotation converted to subscription', subscriptionId: subId, subscriptionNumber: subNum });
});

// ----------------------------------------------------
// Invoices
// ----------------------------------------------------
router.get('/invoices', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() as any[];
  const invoices = rows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoice_number,
    subscriptionId: r.subscription_id,
    subscriptionNumber: r.subscription_number,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerCompany: r.customer_company,
    customerEmail: r.customer_email,
    issueDate: r.issue_date,
    dueDate: r.due_date,
    items: safeJson(r.items, []),
    subtotal: r.subtotal,
    discountCode: r.discount_code,
    discountAmount: r.discount_amount,
    taxAmount: r.tax_amount,
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount,
    outstandingBalance: r.outstanding_balance,
    status: r.status,
    paymentTerms: r.payment_terms,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(invoices);
});

router.post('/invoices', (req: Request, res: Response) => {
  const db = getDatabase();
  const inv = req.body;
  const count = (db.prepare('SELECT COUNT(*) as c FROM invoices').get() as any).c + 1;
  const pad = String(count).padStart(4, '0');
  const year = new Date().getFullYear();
  const id = inv.id || `inv-${Date.now().toString().slice(-6)}`;
  const invNumber = inv.invoiceNumber || `INV/${year}/${pad}`;
  const today = new Date().toISOString().split('T')[0];
  const outstanding = (inv.totalAmount || 0) - (inv.paidAmount || 0);

  db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, subscription_id, subscription_number, customer_id, customer_name,
      customer_company, customer_email, issue_date, due_date, items, subtotal,
      discount_code, discount_amount, tax_amount, total_amount, paid_amount,
      outstanding_balance, status, payment_terms, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    invNumber,
    inv.subscriptionId || null,
    inv.subscriptionNumber || null,
    inv.customerId,
    inv.customerName,
    inv.customerCompany,
    inv.customerEmail,
    inv.issueDate || today,
    inv.dueDate || today,
    JSON.stringify(inv.items || []),
    inv.subtotal || 0,
    inv.discountCode || null,
    inv.discountAmount || 0,
    inv.taxAmount || 0,
    inv.totalAmount || 0,
    inv.paidAmount || 0,
    outstanding,
    inv.status || 'draft',
    inv.paymentTerms || 'Net 15 Days',
    inv.notes || '',
    today,
    today
  );

  res.status(201).json({ id, invoiceNumber: invNumber, outstandingBalance: outstanding, ...inv });
});

router.post('/invoices/:id/pay', (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { amount, method = 'UPI', referenceNumber } = req.body;
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const payAmount = Number(amount) || inv.outstanding_balance;
  const newPaid = (inv.paid_amount || 0) + payAmount;
  const newBalance = Math.max(0, (inv.total_amount || 0) - newPaid);
  const newStatus = newBalance <= 0 ? 'paid' : 'partial';
  const today = new Date().toISOString().split('T')[0];

  // Update invoice
  db.prepare(`
    UPDATE invoices
    SET paid_amount = ?, outstanding_balance = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newPaid, newBalance, newStatus, today, id);

  // Record payment
  const pCount = (db.prepare('SELECT COUNT(*) as c FROM payments').get() as any).c + 1;
  const payId = `pay-${Date.now().toString().slice(-6)}`;
  const payNum = `PAY/2026/${String(pCount).padStart(4, '0')}`;

  db.prepare(`
    INSERT INTO payments (
      id, payment_number, invoice_id, invoice_number, customer_id, customer_company,
      amount, payment_date, method, reference_number, status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    payId,
    payNum,
    inv.id,
    inv.invoice_number,
    inv.customer_id,
    inv.customer_company,
    payAmount,
    today,
    method,
    referenceNumber || `REF-${Date.now().toString().slice(-8)}`,
    'succeeded',
    `Payment recorded for invoice ${inv.invoice_number}`,
    today
  );

  res.json({
    message: 'Payment recorded successfully',
    invoiceStatus: newStatus,
    paidAmount: newPaid,
    outstandingBalance: newBalance,
    paymentId: payId,
    paymentNumber: payNum,
  });
});

// ----------------------------------------------------
// Payments
// ----------------------------------------------------
router.get('/payments', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all() as any[];
  const payments = rows.map((r) => ({
    id: r.id,
    paymentNumber: r.payment_number,
    invoiceId: r.invoice_id,
    invoiceNumber: r.invoice_number,
    customerId: r.customer_id,
    customerCompany: r.customer_company,
    amount: r.amount,
    paymentDate: r.payment_date,
    method: r.method,
    referenceNumber: r.reference_number,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  }));
  res.json(payments);
});

// ----------------------------------------------------
// Discounts & Taxes
// ----------------------------------------------------
router.get('/discounts', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM discounts ORDER BY created_at DESC').all() as any[];
  res.json(rows.map((r) => ({ ...r, applicablePlanIds: safeJson(r.applicable_plan_ids, []) })));
});

router.get('/taxes', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM taxes ORDER BY created_at DESC').all() as any[];
  res.json(rows.map((r) => ({ ...r, isDefault: Boolean(r.is_default) })));
});

// ----------------------------------------------------
// Financial & Dashboard Metrics
// ----------------------------------------------------
router.get('/metrics', (req: Request, res: Response) => {
  const db = getDatabase();

  const totalRevenue = (db.prepare("SELECT SUM(paid_amount) as s FROM invoices WHERE status != 'cancelled'").get() as any).s || 0;
  const overdueBalance = (db.prepare("SELECT SUM(outstanding_balance) as s FROM invoices WHERE status = 'overdue'").get() as any).s || 0;
  const activeSubs = (db.prepare("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active'").get() as any).c || 0;
  const totalCustomers = (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c || 0;

  // Monthly Recurring Revenue estimate
  const activeSubRows = db.prepare("SELECT total_amount, billing_cycle FROM subscriptions WHERE status = 'active'").all() as any[];
  let mrr = 0;
  for (const s of activeSubRows) {
    if (s.billing_cycle === 'daily') mrr += s.total_amount * 30;
    else if (s.billing_cycle === 'weekly') mrr += s.total_amount * 4.33;
    else if (s.billing_cycle === 'monthly') mrr += s.total_amount;
    else if (s.billing_cycle === 'yearly') mrr += s.total_amount / 12;
  }

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    mrr: Math.round(mrr * 100) / 100,
    arr: Math.round(mrr * 12 * 100) / 100,
    activeSubscriptions: activeSubs,
    totalCustomers,
    overdueBalance: Math.round(overdueBalance * 100) / 100,
  });
});

// ----------------------------------------------------
// Automated Billing Engine Trigger
// ----------------------------------------------------
router.post('/billing-cycle/run', (req: Request, res: Response) => {
  const result = runAutomatedBillingCycle(true);
  res.json({ message: 'Billing cycle executed successfully', result });
});

// ----------------------------------------------------
// Audit Logs
// ----------------------------------------------------
router.get('/audit-logs', (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all() as any[];
  res.json(rows.map((r) => ({ ...r, details: safeJson(r.details, {}) })));
});
