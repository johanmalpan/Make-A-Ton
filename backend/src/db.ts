import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'brightloop.db');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

export function initDatabase() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      customer_id TEXT,
      customer_company TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      sales_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      description TEXT,
      notes TEXT,
      variants TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      billing_cycle TEXT NOT NULL,
      price REAL NOT NULL,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      trial_days INTEGER NOT NULL DEFAULT 0,
      available_from TEXT,
      available_until TEXT,
      renewal_rule TEXT NOT NULL,
      target_audience TEXT,
      features TEXT,
      status TEXT NOT NULL,
      product_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      tax_id TEXT,
      address TEXT NOT NULL,
      tier TEXT NOT NULL,
      status TEXT NOT NULL,
      credit_limit REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      subscription_number TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_company TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      start_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      next_renewal_date TEXT NOT NULL,
      line_items TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      auto_renew INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_number TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_company TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      line_items TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_percentage REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      validity_date TEXT NOT NULL,
      status TEXT NOT NULL,
      terms TEXT,
      notes TEXT,
      converted_subscription_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      subscription_id TEXT,
      subscription_number TEXT,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_company TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_code TEXT,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      outstanding_balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_company TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      method TEXT NOT NULL,
      reference_number TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      valid_from TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      usage_limit INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      min_order_amount REAL,
      status TEXT NOT NULL,
      applicable_plan_ids TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS taxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      rate REAL NOT NULL,
      type TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      details TEXT
    );
  `);

  // Default admin user
  const adminCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@brightloop.io');
  if (!adminCheck) {
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, customer_company, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'user-admin-01',
      'Brightloop Administrator',
      'admin@brightloop.io',
      'admin123',
      'admin',
      'Brightloop Software Inc.',
      new Date().toISOString()
    );
  }
}
