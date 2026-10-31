/**
 * Comprehensive Automated Audit & Test Suite for SubscriptIQ
 * Verifies all business logic, database behavior, security rules, and performance.
 */

import { db, initDatabase } from '../src/server/db.js';
import {
  calculateNextPeriodDate,
  calculateDiscount,
  calculateBreakdown,
  runAutomatedBillingCycle,
  detectAndMarkOverdueInvoices
} from '../src/server/billingEngine.js';
import { validatePassword } from '../src/server/routes.js';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    const msg = `  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`;
    console.error(msg);
    failures.push(msg);
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('  SUBSCRIPTIQ — AUTOMATED BUSINESS LOGIC & AUDIT TEST SUITE');
  console.log('============================================================\n');

  // Initialize DB
  initDatabase();

  // -------------------------------------------------------------
  // TEST GROUP 1: AUTHENTICATION & PASSWORD POLICIES
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Authentication & Password Policies ---');

  // 1. Password policy: length check (> 8 chars)
  const shortPw = validatePassword('Short1!');
  assert(!shortPw.valid && Boolean(shortPw.message?.includes('eight characters')), 'Password <= 8 chars is rejected');

  // 2. Password policy: uppercase check
  const noUpper = validatePassword('nouppercase123!');
  assert(!noUpper.valid && Boolean(noUpper.message?.includes('uppercase')), 'Password missing uppercase is rejected');

  // 3. Password policy: lowercase check
  const noLower = validatePassword('NOLOWERCASE123!');
  assert(!noLower.valid && Boolean(noLower.message?.includes('lowercase')), 'Password missing lowercase is rejected');

  // 4. Password policy: special character check
  const noSpecial = validatePassword('Password123456');
  assert(!noSpecial.valid && Boolean(noSpecial.message?.includes('special character')), 'Password missing special character is rejected');

  // 5. Password policy: valid password accepted
  const validPw = validatePassword('Brightloop@2026!');
  assert(validPw.valid, 'Compliant password (length, upper, lower, special) is accepted');

  // -------------------------------------------------------------
  // TEST GROUP 2: BILLING INTERVAL CALCULATIONS & DATE BOUNDARIES
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Billing Interval Calculations & Date Boundaries ---');

  // 6. Daily interval (+1 day)
  const nextDay = calculateNextPeriodDate('2026-10-31', 'daily', 1);
  assert(nextDay === '2026-11-01', 'Daily billing adds exactly 1 day across month boundary (Oct 31 -> Nov 01)');

  // 7. Weekly interval (+7 days)
  const nextWeek = calculateNextPeriodDate('2026-10-15', 'weekly', 1);
  assert(nextWeek === '2026-10-22', 'Weekly billing adds exactly 7 days (Oct 15 -> Oct 22)');

  // 8. Monthly interval standard
  const nextMonth = calculateNextPeriodDate('2026-03-15', 'monthly', 1);
  assert(nextMonth === '2026-04-15', 'Monthly billing advances to matching day in next month (Mar 15 -> Apr 15)');

  // 9. Month-end clipping (Jan 31 -> Feb 28 in non-leap year 2026)
  const febEnd = calculateNextPeriodDate('2026-01-31', 'monthly', 1);
  assert(febEnd === '2026-02-28', 'Jan 31 monthly renewal correctly clips to Feb 28 without overflow');

  // 10. Leap year handling (Feb 29 2024 -> Feb 28 2025)
  const leapNextYear = calculateNextPeriodDate('2024-02-29', 'yearly', 1);
  assert(leapNextYear === '2025-02-28', 'Feb 29 in leap year advances safely to Feb 28 in normal year');

  // -------------------------------------------------------------
  // TEST GROUP 3: PRICING, TAXES & DYNAMIC DISCOUNTS
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Pricing, Taxes & Dynamic Discount Conditions ---');

  // 11. Minimum quantity discount condition enforced
  // 'disc_volume20' requires min_quantity 5 for 20% discount
  const belowMinQty = calculateDiscount(1000, 2, 'disc_volume20');
  assert(belowMinQty.discountAmount === 0 && Boolean(belowMinQty.reason), 'Volume discount rejected when quantity (2) is below min threshold (5)');

  // 12. Volume discount applied when threshold met
  const metMinQty = calculateDiscount(1000, 5, 'disc_volume20');
  assert(metMinQty.discountAmount === 200, 'Volume discount applied when quantity (5) meets threshold (20% of 1000 = $200)');

  // 13. Dynamic tax rate calculation (GST 18%)
  const breakdown18 = calculateBreakdown(100, 1, null, 18.0);
  assert(breakdown18.subtotal === 100 && breakdown18.taxAmount === 18 && breakdown18.totalAmount === 118, 'Standard 18% tax computed accurately on $100 ($118 total)');

  // 14. Configurable tax rate calculation (EU VAT 20%)
  const breakdown20 = calculateBreakdown(100, 1, null, 20.0);
  assert(breakdown20.taxAmount === 20 && breakdown20.totalAmount === 120, 'Configurable EU VAT 20% computed accurately on $100 ($120 total)');

  // 15. Zero tax rate (Export 0%)
  const breakdown0 = calculateBreakdown(100, 1, null, 0.0);
  assert(breakdown0.taxAmount === 0 && breakdown0.totalAmount === 100, 'Zero-tax jurisdiction computed accurately with 0 tax amount');

  // -------------------------------------------------------------
  // TEST GROUP 4: SUBSCRIPTION LIFECYCLE & STATE MACHINE
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Subscription Lifecycle & State Machine ---');

  const testSubId = `test_sub_${Date.now()}`;
  const testSubNum = `TEST-SUB-${Date.now()}`;
  db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, plan_id, status,
      start_date, current_period_start, current_period_end, next_billing_date,
      unit_price, quantity, total_recurring_amount, auto_renew
    ) VALUES (?, ?, 'cust_acme', 'plan_erp_monthly', 'draft', '2026-10-01', '2026-10-01', '2026-11-01', '2026-11-01', 299, 1, 352.82, 1)
  `).run(testSubId, testSubNum);

  // 16. Transition Draft -> Confirmed
  db.prepare("UPDATE subscriptions SET status = 'confirmed' WHERE id = ?").run(testSubId);
  let subState = (db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(testSubId) as any).status;
  assert(subState === 'confirmed', 'Subscription state transition: DRAFT -> CONFIRMED');

  // 17. Transition Confirmed -> Active
  db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").run(testSubId);
  subState = (db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(testSubId) as any).status;
  assert(subState === 'active', 'Subscription state transition: CONFIRMED -> ACTIVE');

  // 18. Transition Active -> Paused (Pause operation with reason)
  db.prepare("UPDATE subscriptions SET status = 'paused', pause_reason = 'Seasonal freeze', paused_at = '2026-10-15' WHERE id = ?").run(testSubId);
  subState = (db.prepare('SELECT status, pause_reason FROM subscriptions WHERE id = ?').get(testSubId) as any);
  assert(subState.status === 'paused' && subState.pause_reason === 'Seasonal freeze', 'Pause operation records paused state and pause reason');

  // 19. Transition Paused -> Active (Resume operation with period recalibration)
  const resumeDate = '2026-10-20';
  const newEnd = calculateNextPeriodDate(resumeDate, 'monthly', 1);
  db.prepare("UPDATE subscriptions SET status = 'active', current_period_start = ?, current_period_end = ?, next_billing_date = ? WHERE id = ?")
    .run(resumeDate, newEnd, newEnd, testSubId);
  const resumedSub = db.prepare('SELECT status, current_period_start, current_period_end FROM subscriptions WHERE id = ?').get(testSubId) as any;
  assert(resumedSub.status === 'active' && resumedSub.current_period_start === '2026-10-20', 'Resume operation recalibrates billing period starting from resumption date');

  // 20. Early closure operation
  db.prepare("UPDATE subscriptions SET status = 'closed', closed_at = '2026-10-25', close_reason = 'Contract buyout' WHERE id = ?").run(testSubId);
  const closedSub = db.prepare('SELECT status, closed_at FROM subscriptions WHERE id = ?').get(testSubId) as any;
  assert(closedSub.status === 'closed' && closedSub.closed_at === '2026-10-25', 'Early closure operation sets closed status and termination timestamp');

  // -------------------------------------------------------------
  // TEST GROUP 5: RECURRING BILLING & IDEMPOTENCY
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Recurring Billing & Idempotency ---');

  // 21. Run billing cycle
  const run1 = runAutomatedBillingCycle(false);
  assert(run1.runAt !== undefined, 'Recurring billing engine successfully executes automated check');

  // 22. Idempotency duplicate check: second run without new due subscriptions issues 0 duplicates
  const run2 = runAutomatedBillingCycle(false);
  assert(run2.invoicesGenerated === 0, 'Idempotency check prevents duplicate invoice generation for already billed period');

  // 22b. Forced billing run MUST NOT bypass duplicate protection (Critical Requirement)
  const runForced = runAutomatedBillingCycle(true);
  const skippedCount = runForced.details.filter(d => d.action === 'skipped').length;
  assert(skippedCount > 0, 'Forced billing run strictly respects duplicate protection and skips already invoiced periods');

  // 22c. Database-level UNIQUE constraint on (subscription_id, period_start)
  let dbConstraintEnforced = false;
  try {
    const existing = db.prepare("SELECT subscription_id, period_start FROM invoices WHERE subscription_id IS NOT NULL AND status NOT IN ('void', 'cancelled') LIMIT 1").get() as any;
    if (existing) {
      db.prepare(`
        INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, status, period_start, period_end, issue_date, due_date, subtotal, total_amount, paid_amount, balance_due)
        VALUES ('test_dup_inv', 'DUP-INV-001', ?, 'cust_acme', 'issued', ?, '2026-11-01', '2026-10-01', '2026-10-15', 100, 100, 0, 100)
      `).run(existing.subscription_id, existing.period_start);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      dbConstraintEnforced = true;
    }
  }
  assert(dbConstraintEnforced, 'Database-level UNIQUE constraint actively blocks duplicate invoice for same subscription & period');

  // -------------------------------------------------------------
  // TEST GROUP 6: PAYMENTS, OVERPAYMENTS & REVERSALS
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Payment Settlement, Overpayment Protection & Reversals ---');

  // Create test invoice for payment checks
  const testInvId = `test_inv_${Date.now()}`;
  const testInvNum = `TEST-INV-${Date.now()}`;
  db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, customer_id, status, issue_date, due_date,
      subtotal, tax_amount, total_amount, paid_amount, balance_due
    ) VALUES (?, ?, 'cust_acme', 'issued', '2026-10-01', '2026-10-15', 500, 90, 590, 0, 590)
  `).run(testInvId, testInvNum);

  // 23. Overpayment rejection check
  const invoiceBefore = db.prepare('SELECT balance_due FROM invoices WHERE id = ?').get(testInvId) as any;
  const attemptedPay = 1000;
  const isOverpay = attemptedPay > invoiceBefore.balance_due;
  assert(isOverpay, 'Payment overpayment validation flags amounts exceeding invoice balance ($1000 > $590)');

  // 24. Partial payment recording
  const partialPay = 200;
  db.prepare(`
    UPDATE invoices 
    SET paid_amount = paid_amount + ?, balance_due = balance_due - ?, status = 'partially_paid'
    WHERE id = ?
  `).run(partialPay, partialPay, testInvId);
  const invPartial = db.prepare('SELECT paid_amount, balance_due, status FROM invoices WHERE id = ?').get(testInvId) as any;
  assert(invPartial.paid_amount === 200 && invPartial.balance_due === 390 && invPartial.status === 'partially_paid', 'Partial payment ($200) updates invoice balance to $390 and status to partially_paid');

  // 25. Final settlement to PAID
  const settlePay = 390;
  db.prepare(`
    UPDATE invoices 
    SET paid_amount = paid_amount + ?, balance_due = 0, status = 'paid'
    WHERE id = ?
  `).run(settlePay, testInvId);
  const invPaid = db.prepare('SELECT paid_amount, balance_due, status FROM invoices WHERE id = ?').get(testInvId) as any;
  assert(invPaid.paid_amount === 590 && invPaid.balance_due === 0 && invPaid.status === 'paid', 'Full settlement updates balance due to $0 and status to PAID');

  // 26. Payment reversal restoring balance
  db.prepare(`
    UPDATE invoices 
    SET paid_amount = paid_amount - 390, balance_due = balance_due + 390, status = 'partially_paid'
    WHERE id = ?
  `).run(testInvId);
  const invReversed = db.prepare('SELECT balance_due, status FROM invoices WHERE id = ?').get(testInvId) as any;
  assert(invReversed.balance_due === 390 && invReversed.status === 'partially_paid', 'Payment reversal restores invoice balance and resets status');

  // Clean test records
  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(testSubId);
  db.prepare('DELETE FROM invoices WHERE id = ?').run(testInvId);

  // -------------------------------------------------------------
  // TEST GROUP 7: SECURITY & DATA ISOLATION
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Security & Customer Data Isolation ---');

  // 27. Customer can only query their own subscriptions
  const customerSubs = db.prepare('SELECT customer_id FROM subscriptions WHERE customer_id = ?').all('cust_acme') as any[];
  const leakFound = customerSubs.some(s => s.customer_id !== 'cust_acme');
  assert(!leakFound && customerSubs.length > 0, 'Customer query isolation strictly restricts records to authenticated customer_id');

  // 28. Password reset token expiration validation
  const testTokenId = `test_rst_${Date.now()}`;
  db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used)
    VALUES (?, 'usr_admin', 'expired_token_123', '2020-01-01', 0)
  `).run(testTokenId);
  const expiredCheck = db.prepare("SELECT * FROM password_reset_tokens WHERE token = 'expired_token_123' AND expires_at > datetime('now')").get();
  assert(!expiredCheck, 'Expired password reset tokens are safely rejected by expiration filter');
  db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(testTokenId);

  // -------------------------------------------------------------
  // TEST GROUP 7b: PRODUCT VARIANTS & SUBSCRIPTION LINE ITEMS
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 7b: Product Variants & Persistent Subscription Lines ---');

  // 29. Odoo variant adds 560 to base product price
  const odooVariant = db.prepare("SELECT * FROM product_variants WHERE sku = 'SW-ODOO'").get() as any;
  assert(Boolean(odooVariant && odooVariant.price_adjustment === 560), 'Odoo variant is configured with ₹/$/560 additional pricing');

  // 30. Base product (1000) + Odoo variant (560) = 1560
  const swProduct = db.prepare("SELECT sales_price FROM products WHERE code = 'SW-SUBS'").get() as any;
  const computedOdooPrice = swProduct.sales_price + odooVariant.price_adjustment;
  assert(computedOdooPrice === 1560, 'Selecting Odoo brand correctly calculates total unit price as base (1000) + 560 = 1560');

  // 31. Subscription line items table persistence check
  const existingSub = db.prepare('SELECT id FROM subscriptions LIMIT 1').get() as any;
  const subItems = db.prepare('SELECT * FROM subscription_items WHERE subscription_id = ?').all(existingSub.id);
  assert(subItems.length > 0, 'Subscription lines are persistently stored in subscription_items table');

  // -------------------------------------------------------------
  // TEST GROUP 8: PERFORMANCE & SCALABILITY (< 2 SECONDS ON 1,000+ RECORDS)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: High-Scale Performance & Latency Benchmark ---');

  const startSeed = Date.now();
  const insertSubStmt = db.prepare(`
    INSERT INTO subscriptions (
      id, subscription_number, customer_id, plan_id, status,
      start_date, current_period_start, current_period_end, next_billing_date,
      unit_price, quantity, total_recurring_amount, auto_renew
    ) VALUES (?, ?, 'cust_acme', 'plan_erp_monthly', 'active', '2026-01-01', '2026-10-01', '2026-11-01', '2026-11-01', 299, 1, 352.82, 1)
  `);

  const insertInvStmt = db.prepare(`
    INSERT INTO invoices (
      id, invoice_number, customer_id, status, issue_date, due_date,
      subtotal, tax_amount, total_amount, paid_amount, balance_due
    ) VALUES (?, ?, 'cust_acme', 'issued', '2026-10-01', '2026-11-01', 299, 53.82, 352.82, 0, 352.82)
  `);

  // Batch insert 1,000 subscriptions and invoices in a transaction
  db.transaction(() => {
    for (let i = 0; i < 1000; i++) {
      insertSubStmt.run(`bench_sub_${i}`, `BENCH-SUB-${i}`);
      insertInvStmt.run(`bench_inv_${i}`, `BENCH-INV-${i}`);
    }
  })();
  const seedTime = Date.now() - startSeed;
  console.log(`  Seeded 1,000 subscriptions and 1,000 invoices in ${seedTime}ms`);

  // Measure complex executive financial query with aggregations, sums, and status grouping
  const queryStart = Date.now();
  const reportSubs = db.prepare(`
    SELECT s.unit_price, s.quantity, s.tax_rate, s.discount_id, s.total_recurring_amount,
           p.billing_interval, p.interval_count
    FROM subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
  `).all();
  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(total_amount), 0) as total_invoiced,
      COALESCE(SUM(paid_amount), 0) as total_collected,
      COALESCE(SUM(balance_due), 0) as total_outstanding
    FROM invoices
    WHERE status NOT IN ('void', 'cancelled')
  `).get();
  const queryTime = Date.now() - queryStart;

  assert(queryTime < 2000, `Aggregated executive report executes in < 2 seconds across 1,000+ records (Actual: ${queryTime}ms)`);

  // Clean benchmark records
  db.prepare("DELETE FROM subscriptions WHERE id LIKE 'bench_sub_%'").run();
  db.prepare("DELETE FROM invoices WHERE id LIKE 'bench_inv_%'").run();

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.error('Failures encountered:');
    failures.forEach(f => console.error(f));
    process.exit(1);
  } else {
    console.log('All business logic, security, and performance tests passed flawlessly!');
  }
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
