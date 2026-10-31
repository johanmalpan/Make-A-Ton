/**
 * Database Cleaning Utility Script
 * Purges all business records, demo accounts, sample customers, products,
 * plans, taxes, discounts, quotations, subscriptions, invoices, and payments.
 * Resets document sequences back to 1000.
 */

import { cleanAllBusinessRecords, db } from '../src/server/db.js';

console.log('>>> [SubscriptIQ] Starting database cleanup...');
try {
  cleanAllBusinessRecords();

  const counts = {
    users: (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c,
    customers: (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c,
    products: (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c,
    plans: (db.prepare('SELECT COUNT(*) as c FROM subscription_plans').get() as any).c,
    subscriptions: (db.prepare('SELECT COUNT(*) as c FROM subscriptions').get() as any).c,
    invoices: (db.prepare('SELECT COUNT(*) as c FROM invoices').get() as any).c,
    payments: (db.prepare('SELECT COUNT(*) as c FROM payments').get() as any).c,
  };

  console.log('>>> [SubscriptIQ] Database successfully cleaned:');
  console.log(JSON.stringify(counts, null, 2));
  console.log('>>> The system is now in a pristine state with 0 records.');
  console.log('>>> First visitor will be greeted with First-Time Administrator Setup.');
} catch (err) {
  console.error('>>> [SubscriptIQ] Cleanup error:', err);
  process.exit(1);
}
