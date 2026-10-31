import { db, getNextDocumentNumber, logAudit } from './db.js';

export interface BillingRunResult {
  runAt: string;
  processedSubscriptions: number;
  invoicesGenerated: number;
  overdueInvoicesDetected: number;
  details: Array<{
    subscriptionId: string;
    subscriptionNumber: string;
    customerName: string;
    action: 'invoiced' | 'skipped' | 'closed' | 'error';
    invoiceNumber?: string;
    amount?: number;
    reason?: string;
  }>;
}

/**
 * Calculates date addition based on exact billing intervals:
 * - daily: +1 day
 * - weekly: +7 days
 * - monthly: calendar month addition (handles 28/29/30/31 boundaries safely)
 * - yearly: +1 year
 */
export function calculateNextPeriodDate(startDateStr: string, interval: 'daily' | 'weekly' | 'monthly' | 'yearly', count = 1): string {
  const parts = startDateStr.split('T')[0].split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const d = new Date(Date.UTC(year, month, day));

  if (interval === 'daily') {
    d.setUTCDate(d.getUTCDate() + count);
  } else if (interval === 'weekly') {
    d.setUTCDate(d.getUTCDate() + (7 * count));
  } else if (interval === 'monthly') {
    const targetDay = day;
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + count);
    const daysInTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(targetDay, daysInTargetMonth));
  } else if (interval === 'yearly') {
    const targetYear = year + count;
    // Handle Feb 29 leap year safely without implicit JS Date rollover
    if (month === 1 && day === 29) {
      const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
      const targetDay = isLeap ? 29 : 28;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(targetDay).padStart(2, '0');
      return `${targetYear}-${mm}-${dd}`;
    } else {
      d.setUTCFullYear(targetYear);
    }
  }

  return d.toISOString().split('T')[0];
}

/**
 * Evaluates and applies discount with strict conditions:
 * - Minimum quantity condition
 * - Minimum subtotal amount condition
 * - Valid date range check
 * - Maximum usage limits check
 */
export function calculateDiscount(subtotal: number, quantity: number, discountId: string | null): { discountAmount: number; discountObj: any; reason?: string } {
  if (!discountId) {
    return { discountAmount: 0, discountObj: null };
  }

  const discount = db.prepare('SELECT * FROM discounts WHERE id = ? AND active = 1').get(discountId) as any;
  if (!discount) {
    return { discountAmount: 0, discountObj: null, reason: 'Discount rule not found or inactive.' };
  }

  // Check usage limit
  if (discount.max_uses !== null && discount.max_uses !== undefined && discount.current_uses >= discount.max_uses) {
    return { discountAmount: 0, discountObj: null, reason: `Discount limit reached (${discount.current_uses}/${discount.max_uses} used).` };
  }

  // Check minimum quantity
  if (quantity < discount.min_quantity) {
    return { discountAmount: 0, discountObj: null, reason: `Requires at least ${discount.min_quantity} quantity.` };
  }

  // Check minimum amount
  if (subtotal < discount.min_amount) {
    return { discountAmount: 0, discountObj: null, reason: `Requires minimum order amount of $${discount.min_amount}.` };
  }

  // Check date bounds if configured
  const today = new Date().toISOString().split('T')[0];
  if (discount.valid_from && today < discount.valid_from) {
    return { discountAmount: 0, discountObj: null, reason: `Discount not valid until ${discount.valid_from}.` };
  }
  if (discount.valid_to && today > discount.valid_to) {
    return { discountAmount: 0, discountObj: null, reason: `Discount expired on ${discount.valid_to}.` };
  }

  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = Number(((subtotal * discount.value) / 100).toFixed(2));
  } else if (discount.type === 'fixed') {
    discountAmount = Math.min(subtotal, Number(discount.value.toFixed(2)));
  }

  return { discountAmount, discountObj: discount };
}

/**
 * Calculates complete pricing breakdown for line items
 */
export function calculateBreakdown(unitPrice: number, quantity: number, discountId: string | null, taxRatePercent: number) {
  const subtotal = Number((unitPrice * quantity).toFixed(2));
  const { discountAmount, discountObj, reason } = calculateDiscount(subtotal, quantity, discountId);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((taxableAmount * taxRatePercent) / 100).toFixed(2));
  const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

  return {
    subtotal,
    discountAmount,
    discountObj,
    discountReason: reason,
    taxableAmount,
    taxRatePercent,
    taxAmount,
    totalAmount
  };
}

/**
 * Checks for overdue invoices and updates their status
 */
export function detectAndMarkOverdueInvoices(): number {
  const today = new Date().toISOString().split('T')[0];
  
  // Find invoices that are issued/partially_paid and past due date
  const stmt = db.prepare(`
    UPDATE invoices 
    SET status = 'overdue'
    WHERE due_date < ? 
      AND balance_due > 0 
      AND status IN ('issued', 'partially_paid', 'confirmed')
  `);
  const info = stmt.run(today);
  return info.changes;
}

/**
 * Automated Recurring Billing Engine:
 * - Scans all ACTIVE subscriptions where next_billing_date <= today
 * - Checks plan expiry/auto-close rules
 * - Verifies idempotency (no duplicate invoice for this period)
 * - Generates invoice and line item
 * - Advances subscription current_period and next_billing_date
 * - Increments discount usage safely
 */
export function runAutomatedBillingCycle(forceRun = false): BillingRunResult {
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = detectAndMarkOverdueInvoices();

  const query = forceRun
    ? `
      SELECT s.*, c.name as customer_name, p.billing_interval, p.interval_count, p.name as plan_name,
             p.auto_close, p.end_date as plan_end_date, pr.name as product_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN subscription_plans p ON s.plan_id = p.id
      JOIN products pr ON p.product_id = pr.id
      WHERE s.status = 'active'
    `
    : `
      SELECT s.*, c.name as customer_name, p.billing_interval, p.interval_count, p.name as plan_name,
             p.auto_close, p.end_date as plan_end_date, pr.name as product_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN subscription_plans p ON s.plan_id = p.id
      JOIN products pr ON p.product_id = pr.id
      WHERE s.status = 'active' 
        AND s.auto_renew = 1
        AND s.next_billing_date <= ?
    `;

  const dueSubscriptions = forceRun ? db.prepare(query).all() as any[] : db.prepare(query).all(today) as any[];

  let invoicesGenerated = 0;
  const details: BillingRunResult['details'] = [];

  for (const sub of dueSubscriptions) {
    try {
      // Check auto-closure if plan ended
      if (sub.auto_close && sub.plan_end_date && today > sub.plan_end_date) {
        db.prepare("UPDATE subscriptions SET status = 'closed', closed_at = ?, close_reason = 'Plan availability ended' WHERE id = ?")
          .run(today, sub.id);
        details.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscription_number,
          customerName: sub.customer_name,
          action: 'closed',
          reason: `Subscription auto-closed: plan ended on ${sub.plan_end_date}`
        });
        continue;
      }

      // 1. Check duplicate invoice for this period (Idempotency - strictly enforced even on forceRun)
      const existingInvoice = db.prepare(`
        SELECT id, invoice_number 
        FROM invoices 
        WHERE subscription_id = ? 
          AND period_start = ? 
          AND status NOT IN ('void', 'cancelled')
      `).get(sub.id, sub.current_period_start) as { id: string; invoice_number: string } | undefined;

      if (existingInvoice) {
        details.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscription_number,
          customerName: sub.customer_name,
          action: 'skipped',
          reason: `Invoice ${existingInvoice.invoice_number} already issued for period starting ${sub.current_period_start}`
        });
        continue;
      }

      // 2. Perform price breakdown
      const breakdown = calculateBreakdown(
        sub.unit_price,
        sub.quantity,
        sub.discount_id,
        sub.tax_rate
      );

      // 3. Generate sequential invoice number atomically
      const invoiceNumber = getNextDocumentNumber('invoice');
      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const dueDate = calculateNextPeriodDate(today, 'daily', 15);

      // Execute in transaction
      db.transaction(() => {
        // Insert invoice
        db.prepare(`
          INSERT INTO invoices (
            id, invoice_number, subscription_id, customer_id, status,
            period_start, period_end, issue_date, due_date,
            subtotal, discount_amount, tax_amount, total_amount,
            paid_amount, balance_due, notes
          ) VALUES (?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)
        `).run(
          invoiceId,
          invoiceNumber,
          sub.id,
          sub.customer_id,
          sub.current_period_start,
          sub.current_period_end,
          today,
          dueDate,
          breakdown.subtotal,
          breakdown.discountAmount,
          breakdown.taxAmount,
          breakdown.totalAmount,
          breakdown.totalAmount,
          `Automated recurring billing cycle for ${sub.plan_name} (${sub.current_period_start} to ${sub.current_period_end})`
        );

        // Insert invoice line item
        db.prepare(`
          INSERT INTO invoice_items (
            id, invoice_id, description, quantity, unit_price, discount_amount, tax_amount, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `ii_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          invoiceId,
          `${sub.product_name} - ${sub.plan_name} (${sub.current_period_start} to ${sub.current_period_end})`,
          sub.quantity,
          sub.unit_price,
          breakdown.discountAmount,
          breakdown.taxAmount,
          breakdown.totalAmount
        );

        // If discount applied, increment discount usage count
        if (sub.discount_id && breakdown.discountAmount > 0) {
          db.prepare('UPDATE discounts SET current_uses = current_uses + 1 WHERE id = ?').run(sub.discount_id);
        }

        // Advance subscription billing dates for next period
        const nextPeriodStart = sub.current_period_end;
        const nextPeriodEnd = calculateNextPeriodDate(nextPeriodStart, sub.billing_interval, sub.interval_count);

        db.prepare(`
          UPDATE subscriptions 
          SET current_period_start = ?,
              current_period_end = ?,
              next_billing_date = ?
          WHERE id = ?
        `).run(nextPeriodStart, nextPeriodEnd, nextPeriodEnd, sub.id);

        logAudit(
          'system_engine',
          'Automated Billing Scheduler',
          'GENERATE_RECURRING_INVOICE',
          'invoice',
          invoiceId,
          {
            subscriptionNumber: sub.subscription_number,
            invoiceNumber,
            totalAmount: breakdown.totalAmount,
            periodStart: sub.current_period_start,
            periodEnd: sub.current_period_end
          }
        );
      })();

      invoicesGenerated++;
      details.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscription_number,
        customerName: sub.customer_name,
        action: 'invoiced',
        invoiceNumber,
        amount: breakdown.totalAmount,
        reason: `Successfully generated invoice for period ${sub.current_period_start} - ${sub.current_period_end}`
      });
    } catch (err: any) {
      console.error(`Billing error for subscription ${sub.id}:`, err);
      details.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscription_number,
        customerName: sub.customer_name,
        action: 'error',
        reason: err.message
      });
    }
  }

  return {
    runAt: new Date().toISOString(),
    processedSubscriptions: dueSubscriptions.length,
    invoicesGenerated,
    overdueInvoicesDetected: overdueCount,
    details
  };
}
