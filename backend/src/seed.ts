import { getDatabase, initDatabase } from './db.js';
import {
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_CUSTOMERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_QUOTATIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_DISCOUNTS,
  INITIAL_TAXES,
} from '../../frontend/src/data/mockData.js';

export function seedAllData() {
  initDatabase();
  const db = getDatabase();

  console.log('[Seed] Seeding database with initial Brightloop mock data...');

  // 1. Products
  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (id, name, code, type, category, sales_price, cost_price, description, notes, variants, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of INITIAL_PRODUCTS) {
    insertProduct.run(
      p.id,
      p.name,
      p.code,
      p.type,
      p.category,
      p.salesPrice,
      p.costPrice,
      p.description || '',
      p.notes || '',
      JSON.stringify(p.variants || []),
      p.status,
      p.createdAt,
      p.updatedAt
    );
  }

  // 2. Plans
  const insertPlan = db.prepare(`
    INSERT OR REPLACE INTO plans (id, name, code, description, billing_cycle, price, min_quantity, trial_days, available_from, available_until, renewal_rule, target_audience, features, status, product_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const pl of INITIAL_PLANS) {
    insertPlan.run(
      pl.id,
      pl.name,
      pl.code,
      pl.description || '',
      pl.billingCycle,
      pl.price,
      pl.minQuantity || 1,
      pl.trialDays || 0,
      pl.availableFrom || null,
      pl.availableUntil || null,
      pl.renewalRule,
      pl.targetAudience || '',
      JSON.stringify(pl.features || []),
      pl.status,
      pl.productId || null,
      pl.createdAt,
      pl.updatedAt
    );
  }

  // 3. Customers
  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (id, name, company, email, phone, tax_id, address, tier, status, credit_limit, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of INITIAL_CUSTOMERS) {
    insertCustomer.run(
      c.id,
      c.name,
      c.company,
      c.email,
      c.phone,
      c.taxId || '',
      JSON.stringify(c.address),
      c.tier,
      c.status,
      c.creditLimit,
      c.notes || '',
      c.createdAt,
      c.updatedAt
    );
  }

  // 4. Subscriptions
  const insertSub = db.prepare(`
    INSERT OR REPLACE INTO subscriptions (id, subscription_number, customer_id, customer_name, customer_company, customer_email, plan_id, plan_name, billing_cycle, start_date, expiry_date, next_renewal_date, line_items, quantity, subtotal, tax_amount, total_amount, auto_renew, status, payment_method, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of INITIAL_SUBSCRIPTIONS) {
    insertSub.run(
      s.id,
      s.subscriptionNumber,
      s.customerId,
      s.customerName,
      s.customerCompany,
      s.customerEmail,
      s.planId,
      s.planName,
      s.billingCycle,
      s.startDate,
      s.expiryDate,
      s.nextRenewalDate,
      JSON.stringify(s.lineItems || []),
      s.quantity,
      s.subtotal,
      s.taxAmount,
      s.totalAmount,
      s.autoRenew ? 1 : 0,
      s.status,
      s.paymentMethod,
      s.notes || '',
      s.createdAt,
      s.updatedAt
    );
  }

  // 5. Quotations
  const insertQuot = db.prepare(`
    INSERT OR REPLACE INTO quotations (id, quotation_number, customer_id, customer_name, customer_company, customer_email, plan_id, plan_name, billing_cycle, line_items, subtotal, discount_percentage, discount_amount, tax_amount, total_amount, validity_date, status, terms, notes, converted_subscription_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const q of INITIAL_QUOTATIONS) {
    insertQuot.run(
      q.id,
      q.quotationNumber,
      q.customerId,
      q.customerName,
      q.customerCompany,
      q.customerEmail,
      q.planId,
      q.planName,
      q.billingCycle,
      JSON.stringify(q.lineItems || []),
      q.subtotal,
      q.discountPercentage || 0,
      q.discountAmount || 0,
      q.taxAmount || 0,
      q.totalAmount,
      q.validityDate,
      q.status,
      q.terms || '',
      q.notes || '',
      q.convertedSubscriptionId || null,
      q.createdAt,
      q.updatedAt
    );
  }

  // 6. Invoices
  const insertInv = db.prepare(`
    INSERT OR REPLACE INTO invoices (id, invoice_number, subscription_id, subscription_number, customer_id, customer_name, customer_company, customer_email, issue_date, due_date, items, subtotal, discount_code, discount_amount, tax_amount, total_amount, paid_amount, outstanding_balance, status, payment_terms, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const inv of INITIAL_INVOICES) {
    insertInv.run(
      inv.id,
      inv.invoiceNumber,
      inv.subscriptionId || null,
      inv.subscriptionNumber || null,
      inv.customerId,
      inv.customerName,
      inv.customerCompany,
      inv.customerEmail,
      inv.issueDate,
      inv.dueDate,
      JSON.stringify(inv.items || []),
      inv.subtotal,
      inv.discountCode || null,
      inv.discountAmount || 0,
      inv.taxAmount || 0,
      inv.totalAmount,
      inv.paidAmount || 0,
      inv.outstandingBalance,
      inv.status,
      inv.paymentTerms,
      inv.notes || '',
      inv.createdAt,
      inv.updatedAt
    );
  }

  // 7. Payments
  const insertPay = db.prepare(`
    INSERT OR REPLACE INTO payments (id, payment_number, invoice_id, invoice_number, customer_id, customer_company, amount, payment_date, method, reference_number, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of INITIAL_PAYMENTS) {
    insertPay.run(
      p.id,
      p.paymentNumber,
      p.invoiceId,
      p.invoiceNumber,
      p.customerId,
      p.customerCompany,
      p.amount,
      p.paymentDate,
      p.method,
      p.referenceNumber,
      p.status,
      p.notes || '',
      p.createdAt
    );
  }

  // 8. Discounts
  const insertDisc = db.prepare(`
    INSERT OR REPLACE INTO discounts (id, code, description, type, value, valid_from, valid_until, usage_limit, usage_count, min_order_amount, status, applicable_plan_ids, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const d of INITIAL_DISCOUNTS) {
    insertDisc.run(
      d.id,
      d.code,
      d.description,
      d.type,
      d.value,
      d.validFrom,
      d.validUntil,
      d.usageLimit,
      d.usageCount,
      d.minOrderAmount || null,
      d.status,
      JSON.stringify(d.applicablePlanIds || []),
      d.createdAt,
      d.updatedAt
    );
  }

  // 9. Taxes
  const insertTax = db.prepare(`
    INSERT OR REPLACE INTO taxes (id, name, code, rate, type, is_default, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of INITIAL_TAXES) {
    insertTax.run(
      t.id,
      t.name,
      t.code,
      t.rate,
      t.type,
      t.isDefault ? 1 : 0,
      t.description,
      t.createdAt,
      t.updatedAt
    );
  }

  console.log('[Seed] Database successfully seeded with full enterprise mock data!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedAllData();
}
