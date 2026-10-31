/**
 * Demo Data Seeding Script (Optional Development Utility)
 * Explicitly inserts sample personas and subscriptions if desired for test runs.
 */

import { seedDemoDataExplicitly, db } from '../src/server/db.js';

console.log('>>> [SubscriptIQ] Starting demo data seeding...');
try {
  seedDemoDataExplicitly();

  const counts = {
    users: (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c,
    customers: (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c,
    products: (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c,
    plans: (db.prepare('SELECT COUNT(*) as c FROM subscription_plans').get() as any).c,
    subscriptions: (db.prepare('SELECT COUNT(*) as c FROM subscriptions').get() as any).c,
    invoices: (db.prepare('SELECT COUNT(*) as c FROM invoices').get() as any).c,
    payments: (db.prepare('SELECT COUNT(*) as c FROM payments').get() as any).c,
  };

  console.log('>>> [SubscriptIQ] Demo data seeded:');
  console.log(JSON.stringify(counts, null, 2));
} catch (err) {
  console.error('>>> [SubscriptIQ] Seeding error:', err);
  process.exit(1);
}
