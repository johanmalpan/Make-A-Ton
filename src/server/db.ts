import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'subscriptiq.db');
export const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Sequences for atomic professional document numbering
    CREATE TABLE IF NOT EXISTS doc_sequences (
      entity_type TEXT PRIMARY KEY,
      prefix TEXT NOT NULL,
      current_val INTEGER NOT NULL DEFAULT 1000
    );

    -- Users table with RBAC (admin, staff, customer)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'customer')),
      customer_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      active INTEGER NOT NULL DEFAULT 1
    );

    -- Password Reset Tokens
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      billing_address TEXT,
      tax_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'service',
      sales_price REAL NOT NULL DEFAULT 0.0,
      cost_price REAL NOT NULL DEFAULT 0.0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    );

    -- Product Variants
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      attributes_json TEXT NOT NULL DEFAULT '{}',
      price_adjustment REAL NOT NULL DEFAULT 0.0,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Subscription Plans
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      billing_interval TEXT NOT NULL CHECK(billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
      interval_count INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      trial_days INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      auto_close INTEGER NOT NULL DEFAULT 0,
      allow_pause INTEGER NOT NULL DEFAULT 1,
      allow_early_closure INTEGER NOT NULL DEFAULT 1,
      allow_renewal INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );

    -- Taxes
    CREATE TABLE IF NOT EXISTS taxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate_percent REAL NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    -- Discounts
    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      min_amount REAL NOT NULL DEFAULT 0.0,
      valid_from TEXT,
      valid_to TEXT,
      max_uses INTEGER,
      current_uses INTEGER NOT NULL DEFAULT 0,
      product_id TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    -- Quotation Templates
    CREATE TABLE IF NOT EXISTS quotation_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      plan_id TEXT NOT NULL,
      default_quantity INTEGER NOT NULL DEFAULT 1,
      default_discount_id TEXT,
      terms TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (default_discount_id) REFERENCES discounts(id) ON DELETE SET NULL
    );

    -- Quotations
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'converted')),
      subtotal REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      valid_until TEXT NOT NULL,
      terms TEXT,
      notes TEXT,
      converted_subscription_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    );

    -- Quotation Line Items
    CREATE TABLE IF NOT EXISTS quotation_items (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      discount_percent REAL NOT NULL DEFAULT 0.0,
      tax_rate REAL NOT NULL DEFAULT 0.0,
      amount REAL NOT NULL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
    );

    -- Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      variant_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed', 'expired')),
      start_date TEXT NOT NULL,
      current_period_start TEXT NOT NULL,
      current_period_end TEXT NOT NULL,
      next_billing_date TEXT NOT NULL,
      paused_at TEXT,
      pause_reason TEXT,
      resume_date TEXT,
      cancelled_at TEXT,
      cancel_reason TEXT,
      closed_at TEXT,
      close_reason TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      discount_id TEXT,
      tax_rate REAL NOT NULL DEFAULT 0.0,
      total_recurring_amount REAL NOT NULL,
      auto_renew INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
      FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL
    );

    -- Subscription Line Items (Persistent multi-line subscription items)
    CREATE TABLE IF NOT EXISTS subscription_items (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );

    -- Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      subscription_id TEXT,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('draft', 'confirmed', 'issued', 'paid', 'partially_paid', 'cancelled', 'overdue', 'void')),
      period_start TEXT,
      period_end TEXT,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      paid_amount REAL NOT NULL DEFAULT 0.0,
      balance_due REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    );

    -- Invoice Items
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT UNIQUE NOT NULL,
      invoice_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('credit_card', 'upi', 'bank_transfer', 'stripe_simulation', 'cash')),
      transaction_reference TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'reversed', 'failed')),
      notes TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      reversed_at TEXT,
      reversal_reason TEXT,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indices for high performance queries and referential queries
    CREATE INDEX IF NOT EXISTS idx_cust_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sub_customer ON subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_sub_next_billing ON subscriptions(next_billing_date);
    CREATE INDEX IF NOT EXISTS idx_sub_items_sub ON subscription_items(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_inv_subscription ON invoices(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_inv_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_inv_due_date ON invoices(due_date);
    CREATE INDEX IF NOT EXISTS idx_pay_invoice ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_pay_customer ON payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_plans_product ON subscription_plans(product_id);
    CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_quot_customer ON quotations(customer_id);
    CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);

    -- Strict database-level uniqueness to prevent duplicate invoices for the same subscription billing period
    CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_sub_period ON invoices(subscription_id, period_start)
      WHERE subscription_id IS NOT NULL AND period_start IS NOT NULL AND status NOT IN ('void', 'cancelled');
  `);

  // Ensure migrations on existing columns if upgraded
  safeAddColumn('products', 'sales_price', 'REAL NOT NULL DEFAULT 0.0');
  safeAddColumn('products', 'cost_price', 'REAL NOT NULL DEFAULT 0.0');
  safeAddColumn('products', 'product_type', "TEXT NOT NULL DEFAULT 'service'");
  safeAddColumn('subscription_plans', 'min_quantity', 'INTEGER NOT NULL DEFAULT 1');
  safeAddColumn('subscription_plans', 'start_date', 'TEXT DEFAULT NULL');
  safeAddColumn('subscription_plans', 'end_date', 'TEXT DEFAULT NULL');
  safeAddColumn('subscription_plans', 'auto_close', 'INTEGER NOT NULL DEFAULT 0');
  safeAddColumn('subscription_plans', 'allow_pause', 'INTEGER NOT NULL DEFAULT 1');
  safeAddColumn('subscription_plans', 'allow_early_closure', 'INTEGER NOT NULL DEFAULT 1');
  safeAddColumn('subscription_plans', 'allow_renewal', 'INTEGER NOT NULL DEFAULT 1');
  safeAddColumn('discounts', 'max_uses', 'INTEGER DEFAULT NULL');
  safeAddColumn('discounts', 'current_uses', 'INTEGER NOT NULL DEFAULT 0');
  safeAddColumn('subscriptions', 'variant_id', 'TEXT DEFAULT NULL');
  safeAddColumn('subscriptions', 'closed_at', 'TEXT DEFAULT NULL');
  safeAddColumn('subscriptions', 'close_reason', 'TEXT DEFAULT NULL');

  migrateSubscriptionStatuses();
  backfillSubscriptionItems();

  // Initialize sequences if empty
  const sequences = [
    { entity_type: 'quotation', prefix: 'QT-2026-', current_val: 1000 },
    { entity_type: 'subscription', prefix: 'SUB-2026-', current_val: 2000 },
    { entity_type: 'invoice', prefix: 'INV-2026-', current_val: 5000 },
    { entity_type: 'payment', prefix: 'PAY-2026-', current_val: 8000 },
  ];

  const getSeq = db.prepare('SELECT current_val FROM doc_sequences WHERE entity_type = ?');
  const insertSeq = db.prepare('INSERT INTO doc_sequences (entity_type, prefix, current_val) VALUES (?, ?, ?)');

  for (const s of sequences) {
    const existing = getSeq.get(s.entity_type);
    if (!existing) {
      insertSeq.run(s.entity_type, s.prefix, s.current_val);
    }
  }

  // Only seed demo data if explicitly requested via environment variable (Disabled by default)
  if (process.env.SEED_DEMO_DATA === 'true') {
    seedDemoDataExplicitly();
  }
}

/**
 * Purges all business records while preserving database schema, tables, and sequence definitions
 */
export function cleanAllBusinessRecords() {
  db.transaction(() => {
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM invoice_items').run();
    db.prepare('DELETE FROM invoices').run();
    db.prepare('DELETE FROM subscription_items').run();
    db.prepare('DELETE FROM subscriptions').run();
    db.prepare('DELETE FROM quotation_items').run();
    db.prepare('DELETE FROM quotations').run();
    db.prepare('DELETE FROM quotation_templates').run();
    db.prepare('DELETE FROM product_variants').run();
    db.prepare('DELETE FROM subscription_plans').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM discounts').run();
    db.prepare('DELETE FROM taxes').run();
    db.prepare('DELETE FROM password_reset_tokens').run();
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM customers').run();
    db.prepare('UPDATE doc_sequences SET current_val = 1000').run();
  })();
  console.log('[Database] Cleaned all business records. Database is fresh.');
}

export function backfillSubscriptionItems() {
  try {
    const subsWithoutItems = db.prepare(`
      SELECT s.id, s.plan_id, s.variant_id, s.unit_price, s.quantity, s.tax_rate, s.total_recurring_amount,
             p.product_id, p.name as plan_name, pr.name as product_name
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      JOIN products pr ON p.product_id = pr.id
      WHERE NOT EXISTS (SELECT 1 FROM subscription_items WHERE subscription_id = s.id)
    `).all() as any[];

    if (subsWithoutItems.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO subscription_items (
          id, subscription_id, product_id, variant_id, description,
          quantity, unit_price, discount_amount, tax_amount, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const s of subsWithoutItems) {
        const itemId = `si_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const subtotal = s.unit_price * s.quantity;
        const taxAmount = Number(((subtotal * s.tax_rate) / 100).toFixed(2));
        insertItem.run(
          itemId, s.id, s.product_id, s.variant_id,
          `${s.product_name} - ${s.plan_name}`,
          s.quantity, s.unit_price, 0.0, taxAmount, s.total_recurring_amount
        );
      }
    }
  } catch (err) {
    console.error('Backfill subscription items notice:', err);
  }
}

export function ensureOdooVariantSeed() {
  try {
    const existingProd = db.prepare("SELECT id FROM products WHERE code = 'SW-SUBS'").get() as any;
    let prodId = existingProd?.id;
    if (!existingProd) {
      prodId = 'prod_sw_subs';
      db.prepare(`
        INSERT INTO products (id, name, code, description, category, product_type, sales_price, cost_price)
        VALUES (?, 'Software Subscription', 'SW-SUBS', 'Standard enterprise software application subscription', 'Software', 'service', 1000.0, 150.0)
      `).run(prodId);
    }

    const odooVar = db.prepare("SELECT id FROM product_variants WHERE sku = 'SW-ODOO'").get();
    if (!odooVar) {
      db.prepare(`
        INSERT INTO product_variants (id, product_id, name, sku, attributes_json, price_adjustment)
        VALUES ('var_odoo_560', ?, 'Odoo Brand Edition', 'SW-ODOO', '{"brand":"Odoo","support":"Priority"}', 560.0)
      `).run(prodId);
    }

    const stdVar = db.prepare("SELECT id FROM product_variants WHERE sku = 'SW-STD'").get();
    if (!stdVar) {
      db.prepare(`
        INSERT INTO product_variants (id, product_id, name, sku, attributes_json, price_adjustment)
        VALUES ('var_std_0', ?, 'Standard Edition', 'SW-STD', '{"brand":"Standard"}', 0.0)
      `).run(prodId);
    }
  } catch (err) {
    console.error('Ensure Odoo variant notice:', err);
  }
}

function safeAddColumn(table: string, column: string, definition: string) {
  try {
    const info = db.pragma(`table_info(${table})`) as Array<{ name: string }>;
    const exists = info.some(col => col.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (err) {
    // Ignore if column already exists
  }
}

export function migrateSubscriptionStatuses() {
  try {
    const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='subscriptions'").get() as any;
    if (tableSql && !tableSql.sql.includes("'confirmed'")) {
      db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE subscriptions_migrated (
          id TEXT PRIMARY KEY,
          subscription_number TEXT UNIQUE NOT NULL,
          customer_id TEXT NOT NULL,
          plan_id TEXT NOT NULL,
          variant_id TEXT,
          status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed', 'cancelled', 'expired')),
          start_date TEXT NOT NULL,
          current_period_start TEXT NOT NULL,
          current_period_end TEXT NOT NULL,
          next_billing_date TEXT NOT NULL,
          paused_at TEXT,
          pause_reason TEXT,
          resume_date TEXT,
          cancelled_at TEXT,
          cancel_reason TEXT,
          closed_at TEXT,
          close_reason TEXT,
          unit_price REAL NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          discount_id TEXT,
          tax_rate REAL NOT NULL DEFAULT 0.0,
          total_recurring_amount REAL NOT NULL,
          auto_renew INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
          FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
          FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
          FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL
        );
        INSERT INTO subscriptions_migrated SELECT 
          id, subscription_number, customer_id, plan_id, variant_id, status,
          start_date, current_period_start, current_period_end, next_billing_date,
          paused_at, pause_reason, resume_date, cancelled_at, cancel_reason,
          closed_at, close_reason, unit_price, quantity, discount_id, tax_rate,
          total_recurring_amount, auto_renew, created_at
        FROM subscriptions;
        DROP TABLE subscriptions;
        ALTER TABLE subscriptions_migrated RENAME TO subscriptions;
        PRAGMA foreign_keys = ON;
      `);
      console.log('Subscriptions table migrated to full lifecycle status constraint.');
    }
  } catch (err) {
    console.error('Migration notice:', err);
  }
}

/**
 * Thread-safe auto-incrementing document numbering generator
 */
export function getNextDocumentNumber(entityType: 'quotation' | 'subscription' | 'invoice' | 'payment'): string {
  const stmt = db.prepare(`
    UPDATE doc_sequences 
    SET current_val = current_val + 1 
    WHERE entity_type = ? 
    RETURNING prefix, current_val
  `);
  const row = stmt.get(entityType) as { prefix: string; current_val: number };
  if (!row) {
    throw new Error(`Unknown entity sequence: ${entityType}`);
  }
  return `${row.prefix}${row.current_val}`;
}

export function logAudit(userId: string | null, userName: string | null, action: string, entityType: string, entityId: string | null, details: Record<string, any>) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, userName, action, entityType, entityId, JSON.stringify(details));
}

export function seedDemoDataExplicitly() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt > 0) {
    return; // Already seeded
  }

  console.log('[Database] Explicitly seeding demo development data for SubscriptIQ...');

  const passwordHashAdmin = bcrypt.hashSync('Admin@123', 10);
  const passwordHashStaff = bcrypt.hashSync('Staff@123', 10);
  const passwordHashCustomer = bcrypt.hashSync('Customer@123', 10);

  // 1. Customers
  const customers = [
    {
      id: 'cust_acme',
      name: 'Acme Corporation',
      company: 'Acme Technologies Inc.',
      email: 'alex@acmecorp.com',
      phone: '+1 (555) 234-5678',
      billing_address: '100 Innovation Way, Suite 400, San Francisco, CA 94107',
      tax_id: 'US-EIN-94301928',
      status: 'active'
    },
    {
      id: 'cust_techflow',
      name: 'TechFlow Solutions',
      company: 'TechFlow Global LLC',
      email: 'sarah@techflow.io',
      phone: '+1 (555) 987-6543',
      billing_address: '452 Broadway, Floor 8, New York, NY 10013',
      tax_id: 'US-EIN-88192034',
      status: 'active'
    },
    {
      id: 'cust_apex',
      name: 'Apex Digital Labs',
      company: 'Apex Media & Software Ltd.',
      email: 'marcus@apexdigital.com',
      phone: '+1 (555) 345-6789',
      billing_address: '777 Tech Parkway, Austin, TX 78701',
      tax_id: 'US-EIN-74910283',
      status: 'active'
    },
    {
      id: 'cust_zenith',
      name: 'Zenith Logistics',
      company: 'Zenith Freight & Supply Co.',
      email: 'operations@zenithlog.com',
      phone: '+1 (555) 890-1234',
      billing_address: '1200 Harbor Blvd, Seattle, WA 98104',
      tax_id: 'US-EIN-91029384',
      status: 'active'
    }
  ];

  const insertCust = db.prepare(`
    INSERT INTO customers (id, name, company, email, phone, billing_address, tax_id, status)
    VALUES (@id, @name, @company, @email, @phone, @billing_address, @tax_id, @status)
  `);
  for (const c of customers) insertCust.run(c);

  // 2. Users (Admin, Staff, Customer)
  const users = [
    {
      id: 'usr_admin',
      email: 'admin@brightloop.com',
      password_hash: passwordHashAdmin,
      full_name: 'Elena Rostova (Admin)',
      role: 'admin',
      customer_id: null
    },
    {
      id: 'usr_staff',
      email: 'staff@brightloop.com',
      password_hash: passwordHashStaff,
      full_name: 'David Kim (Billing Specialist)',
      role: 'staff',
      customer_id: null
    },
    {
      id: 'usr_cust_alex',
      email: 'alex@acmecorp.com',
      password_hash: passwordHashCustomer,
      full_name: 'Alex Rivera',
      role: 'customer',
      customer_id: 'cust_acme'
    },
    {
      id: 'usr_cust_sarah',
      email: 'sarah@techflow.io',
      password_hash: passwordHashCustomer,
      full_name: 'Sarah Jenkins',
      role: 'customer',
      customer_id: 'cust_techflow'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, customer_id)
    VALUES (@id, @email, @password_hash, @full_name, @role, @customer_id)
  `);
  for (const u of users) insertUser.run(u);

  // 3. Taxes
  const taxes = [
    { id: 'tax_gst18', name: 'Standard GST / VAT (18%)', rate_percent: 18.0, is_default: 1, description: 'Standard rate for digital services' },
    { id: 'tax_vat20', name: 'European Union VAT (20%)', rate_percent: 20.0, is_default: 0, description: 'Digital goods cross-border EU tax' },
    { id: 'tax_us8', name: 'US State Sales Tax (8.25%)', rate_percent: 8.25, is_default: 0, description: 'Average US state SaaS tax' },
    { id: 'tax_zero', name: 'Zero Tax / Export (0%)', rate_percent: 0.0, is_default: 0, description: 'B2B international reverse charge' },
  ];
  const insertTax = db.prepare(`
    INSERT INTO taxes (id, name, rate_percent, is_default, description)
    VALUES (@id, @name, @rate_percent, @is_default, @description)
  `);
  for (const t of taxes) insertTax.run(t);

  // 4. Discounts (Dynamic with min_quantity conditions)
  const discounts = [
    { id: 'disc_welcome10', code: 'WELCOME10', name: 'New Client Welcome 10%', type: 'percentage', value: 10.0, min_quantity: 1, min_amount: 0, max_uses: 100, current_uses: 2 },
    { id: 'disc_volume20', code: 'VOLUME20', name: 'Team Volume Discount (5+ seats)', type: 'percentage', value: 20.0, min_quantity: 5, min_amount: 100, max_uses: 500, current_uses: 0 },
    { id: 'disc_enterprise500', code: 'ENT500', name: 'Enterprise Fixed Rebate ($500)', type: 'fixed', value: 500.0, min_quantity: 10, min_amount: 2000, max_uses: 50, current_uses: 1 },
    { id: 'disc_flash15', code: 'FLASH15', name: 'Quarterly Upgrade 15%', type: 'percentage', value: 15.0, min_quantity: 2, min_amount: 50, max_uses: 200, current_uses: 0 },
  ];
  const insertDisc = db.prepare(`
    INSERT INTO discounts (id, code, name, type, value, min_quantity, min_amount, max_uses, current_uses)
    VALUES (@id, @code, @name, @type, @value, @min_quantity, @min_amount, @max_uses, @current_uses)
  `);
  for (const d of discounts) insertDisc.run(d);

  // 5. Products & Variants
  const products = [
    { id: 'prod_erp', name: 'Brightloop ERP Suite', code: 'BL-ERP', description: 'Enterprise resource planning, inventory, automated workflows', category: 'Enterprise Core', product_type: 'service', sales_price: 299.0, cost_price: 50.0 },
    { id: 'prod_analytics', name: 'Brightloop Analytics Cloud', code: 'BL-ANL', description: 'Real-time telemetry, predictive cohort intelligence & SQL query engine', category: 'Data & AI', product_type: 'service', sales_price: 149.0, cost_price: 25.0 },
    { id: 'prod_crm', name: 'Brightloop CRM Pro', code: 'BL-CRM', description: 'Omnichannel customer pipeline, quotation generator, deal tracking', category: 'Sales & Ops', product_type: 'service', sales_price: 79.0, cost_price: 15.0 },
  ];
  const insertProd = db.prepare(`
    INSERT INTO products (id, name, code, description, category, product_type, sales_price, cost_price)
    VALUES (@id, @name, @code, @description, @category, @product_type, @sales_price, @cost_price)
  `);
  for (const p of products) insertProd.run(p);

  const variants = [
    { id: 'var_erp_std', product_id: 'prod_erp', name: 'Standard Edition (500GB Storage)', sku: 'BL-ERP-STD', attributes_json: JSON.stringify({ tier: 'Standard', storage: '500GB', users: 'Up to 25' }), price_adjustment: 0.0 },
    { id: 'var_erp_ent', product_id: 'prod_erp', name: 'Enterprise Edition (Unlimited Storage + 24/7 SLA)', sku: 'BL-ERP-ENT', attributes_json: JSON.stringify({ tier: 'Enterprise', storage: 'Unlimited', users: 'Unlimited', sla: '99.99%' }), price_adjustment: 200.0 },
    { id: 'var_anl_pro', product_id: 'prod_analytics', name: 'Pro Analytics (10M Events/mo)', sku: 'BL-ANL-PRO', attributes_json: JSON.stringify({ events: '10M', retentions: '1 Year' }), price_adjustment: 0.0 },
    { id: 'var_anl_scale', product_id: 'prod_analytics', name: 'Scale Analytics (100M Events/mo + Dedicated GPU)', sku: 'BL-ANL-SCALE', attributes_json: JSON.stringify({ events: '100M', retentions: '3 Years' }), price_adjustment: 350.0 },
    { id: 'var_crm_team', product_id: 'prod_crm', name: 'Growth Team (10 Seats)', sku: 'BL-CRM-GROWTH', attributes_json: JSON.stringify({ seats: 10, emailSync: true }), price_adjustment: 0.0 },
  ];
  const insertVar = db.prepare(`
    INSERT INTO product_variants (id, product_id, name, sku, attributes_json, price_adjustment)
    VALUES (@id, @product_id, @name, @sku, @attributes_json, @price_adjustment)
  `);
  for (const v of variants) insertVar.run(v);

  // 6. Subscription Plans (supporting daily, weekly, monthly, yearly billing)
  const plans = [
    {
      id: 'plan_erp_monthly',
      name: 'ERP Pro Monthly',
      code: 'ERP-M-PRO',
      product_id: 'prod_erp',
      variant_id: 'var_erp_std',
      billing_interval: 'monthly',
      interval_count: 1,
      price: 299.0,
      currency: 'USD',
      trial_days: 14,
      description: 'Standard ERP Suite billed monthly per organization',
      min_quantity: 1,
      allow_pause: 1,
      allow_early_closure: 1,
      allow_renewal: 1
    },
    {
      id: 'plan_erp_yearly',
      name: 'ERP Enterprise Annual',
      code: 'ERP-Y-ENT',
      product_id: 'prod_erp',
      variant_id: 'var_erp_ent',
      billing_interval: 'yearly',
      interval_count: 1,
      price: 4990.0,
      currency: 'USD',
      trial_days: 30,
      description: 'Full Enterprise ERP with 24/7 SLA billed annually (2 months free)',
      min_quantity: 1,
      allow_pause: 1,
      allow_early_closure: 1,
      allow_renewal: 1
    },
    {
      id: 'plan_anl_monthly',
      name: 'Analytics Cloud Monthly',
      code: 'ANL-M-PRO',
      product_id: 'prod_analytics',
      variant_id: 'var_anl_pro',
      billing_interval: 'monthly',
      interval_count: 1,
      price: 149.0,
      currency: 'USD',
      trial_days: 7,
      description: 'Full analytics cloud pipeline with monthly billing',
      min_quantity: 1,
      allow_pause: 1,
      allow_early_closure: 1,
      allow_renewal: 1
    },
    {
      id: 'plan_anl_weekly',
      name: 'Analytics Sprint Weekly',
      code: 'ANL-W-SPRINT',
      product_id: 'prod_analytics',
      variant_id: 'var_anl_pro',
      billing_interval: 'weekly',
      interval_count: 1,
      price: 49.0,
      currency: 'USD',
      trial_days: 3,
      description: 'Short sprint weekly billing for temporary crunch or seasonal audit',
      min_quantity: 1,
      allow_pause: 1,
      allow_early_closure: 1,
      allow_renewal: 1
    },
    {
      id: 'plan_crm_daily',
      name: 'CRM Daily Pass',
      code: 'CRM-D-PASS',
      product_id: 'prod_crm',
      variant_id: 'var_crm_team',
      billing_interval: 'daily',
      interval_count: 1,
      price: 15.0,
      currency: 'USD',
      trial_days: 0,
      description: 'Daily pay-as-you-go CRM access for events and expos',
      min_quantity: 1,
      allow_pause: 0,
      allow_early_closure: 1,
      allow_renewal: 1
    },
    {
      id: 'plan_crm_yearly',
      name: 'CRM Pro Annual',
      code: 'CRM-Y-PRO',
      product_id: 'prod_crm',
      variant_id: 'var_crm_team',
      billing_interval: 'yearly',
      interval_count: 1,
      price: 1200.0,
      currency: 'USD',
      trial_days: 14,
      description: 'Yearly license for full sales pipeline',
      min_quantity: 1,
      allow_pause: 1,
      allow_early_closure: 1,
      allow_renewal: 1
    }
  ];

  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (id, name, code, product_id, variant_id, billing_interval, interval_count, price, currency, trial_days, description, min_quantity, allow_pause, allow_early_closure, allow_renewal)
    VALUES (@id, @name, @code, @product_id, @variant_id, @billing_interval, @interval_count, @price, @currency, @trial_days, @description, @min_quantity, @allow_pause, @allow_early_closure, @allow_renewal)
  `);
  for (const pl of plans) insertPlan.run(pl);

  // 7. Quotation Templates
  const templates = [
    {
      id: 'tmpl_starter',
      name: 'Brightloop Starter Software Package',
      description: 'Ideal for fast-growing startups requiring ERP Core + Analytics setup',
      plan_id: 'plan_erp_monthly',
      default_quantity: 1,
      default_discount_id: 'disc_welcome10',
      terms: 'Standard 30-day payment terms. Includes onboarding and technical support.'
    },
    {
      id: 'tmpl_enterprise',
      name: 'Brightloop Enterprise Transformation Bundle',
      description: 'Annual enterprise commitment with custom SLA and volume pricing',
      plan_id: 'plan_erp_yearly',
      default_quantity: 1,
      default_discount_id: 'disc_enterprise500',
      terms: 'Annual contract auto-renews unless written notice 60 days prior. Dedicated account architect included.'
    }
  ];
  const insertTmpl = db.prepare(`
    INSERT INTO quotation_templates (id, name, description, plan_id, default_quantity, default_discount_id, terms)
    VALUES (@id, @name, @description, @plan_id, @default_quantity, @default_discount_id, @terms)
  `);
  for (const tmpl of templates) insertTmpl.run(tmpl);

  // 8. Sample Quotations
  const qNum1 = getNextDocumentNumber('quotation');
  db.prepare(`
    INSERT INTO quotations (id, quotation_number, customer_id, created_by, status, subtotal, discount_amount, tax_amount, total_amount, valid_until, terms, notes)
    VALUES ('quot_1', ?, 'cust_acme', 'usr_admin', 'sent', 299.0, 29.90, 48.44, 317.54, '2026-11-30', 'Net 30 days. All prices subject to state tax.', 'Q4 expansion quotation for Acme Corp')
  `).run(qNum1);

  db.prepare(`
    INSERT INTO quotation_items (id, quotation_id, plan_id, product_name, plan_name, quantity, unit_price, discount_percent, tax_rate, amount)
    VALUES ('qi_1', 'quot_1', 'plan_erp_monthly', 'Brightloop ERP Suite', 'ERP Pro Monthly', 1, 299.0, 10.0, 18.0, 317.54)
  `).run();

  // 9. Sample Active Subscriptions
  const subNum1 = getNextDocumentNumber('subscription');
  const subNum2 = getNextDocumentNumber('subscription');
  const subNum3 = getNextDocumentNumber('subscription');

  // Sub 1: Acme Corp - Monthly ERP
  db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, plan_id, variant_id, status, start_date,
      current_period_start, current_period_end, next_billing_date, unit_price,
      quantity, discount_id, tax_rate, total_recurring_amount, auto_renew
    ) VALUES (
      'sub_acme_erp', ?, 'cust_acme', 'plan_erp_monthly', 'var_erp_std', 'active', '2026-08-01',
      '2026-10-01', '2026-11-01', '2026-11-01', 299.0,
      1, 'disc_welcome10', 18.0, 317.54, 1
    )
  `).run(subNum1);

  // Sub 2: TechFlow - Annual ERP
  db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, plan_id, variant_id, status, start_date,
      current_period_start, current_period_end, next_billing_date, unit_price,
      quantity, discount_id, tax_rate, total_recurring_amount, auto_renew
    ) VALUES (
      'sub_techflow_ent', ?, 'cust_techflow', 'plan_erp_yearly', 'var_erp_ent', 'active', '2026-01-15',
      '2026-01-15', '2027-01-15', '2027-01-15', 4990.0,
      1, 'disc_enterprise500', 18.0, 5298.20, 1
    )
  `).run(subNum2);

  // Sub 3: Apex Digital - Weekly Analytics (Due for billing today to test automated billing!)
  db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, plan_id, variant_id, status, start_date,
      current_period_start, current_period_end, next_billing_date, unit_price,
      quantity, discount_id, tax_rate, total_recurring_amount, auto_renew
    ) VALUES (
      'sub_apex_weekly', ?, 'cust_apex', 'plan_anl_weekly', 'var_anl_pro', 'active', '2026-10-15',
      '2026-10-22', '2026-10-29', '2026-10-29', 49.0,
      2, NULL, 18.0, 115.64, 1
    )
  `).run(subNum3);

  // 10. Sample Invoices
  const invNum1 = getNextDocumentNumber('invoice');
  const invNum2 = getNextDocumentNumber('invoice');
  const invNum3 = getNextDocumentNumber('invoice');

  // Inv 1: Paid invoice
  db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, subscription_id, customer_id, status, period_start, period_end,
      issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, notes
    ) VALUES (
      'inv_1', ?, 'sub_acme_erp', 'cust_acme', 'paid', '2026-09-01', '2026-10-01',
      '2026-09-01', '2026-09-15', 299.0, 29.90, 48.44, 317.54, 317.54, 0.0, 'Billed for September 2026'
    )
  `).run(invNum1);

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, discount_amount, tax_amount, total_amount)
    VALUES ('ii_1', 'inv_1', 'Brightloop ERP Suite - ERP Pro Monthly (Sep 01 - Oct 01)', 1, 299.0, 29.90, 48.44, 317.54)
  `).run();

  // Inv 2: Current Issued Invoice with balance due
  db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, subscription_id, customer_id, status, period_start, period_end,
      issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, notes
    ) VALUES (
      'inv_2', ?, 'sub_acme_erp', 'cust_acme', 'issued', '2026-10-01', '2026-11-01',
      '2026-10-01', '2026-11-05', 299.0, 29.90, 48.44, 317.54, 0.0, 317.54, 'Billed for October 2026'
    )
  `).run(invNum2);

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, discount_amount, tax_amount, total_amount)
    VALUES ('ii_2', 'inv_2', 'Brightloop ERP Suite - ERP Pro Monthly (Oct 01 - Nov 01)', 1, 299.0, 29.90, 48.44, 317.54)
  `).run();

  // Inv 3: Overdue Invoice for Apex Digital to demonstrate overdue aging reports
  db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, subscription_id, customer_id, status, period_start, period_end,
      issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, notes
    ) VALUES (
      'inv_3', ?, 'sub_apex_weekly', 'cust_apex', 'overdue', '2026-09-15', '2026-09-22',
      '2026-09-15', '2026-09-25', 98.0, 0.0, 17.64, 115.64, 0.0, 115.64, 'Past due weekly billing cycle'
    )
  `).run(invNum3);

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, discount_amount, tax_amount, total_amount)
    VALUES ('ii_3', 'inv_3', 'Brightloop Analytics Cloud - Weekly Sprint x 2 (Sep 15 - Sep 22)', 2, 49.0, 0.0, 17.64, 115.64)
  `).run();

  // 11. Payments
  const payNum1 = getNextDocumentNumber('payment');
  db.prepare(`
    INSERT INTO payments (id, payment_number, invoice_id, customer_id, amount, payment_method, transaction_reference, status, notes, paid_at)
    VALUES ('pay_1', ?, 'inv_1', 'cust_acme', 317.54, 'credit_card', 'tx_stripe_88492019', 'completed', 'Auto-charged corporate Visa ending 4242', '2026-09-02 10:15:00')
  `).run(payNum1);

  console.log('SubscriptIQ initial database seeded successfully!');
}
