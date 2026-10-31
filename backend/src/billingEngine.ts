import { getDatabase } from './db.js';

export interface BillingCycleResult {
  timestamp: string;
  processedSubscriptions: number;
  invoicesGenerated: number;
  overdueInvoicesUpdated: number;
  errors: string[];
}

function calculateNextDate(currentDateStr: string, cycle: string): string {
  const d = new Date(currentDateStr);
  switch (cycle) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function runAutomatedBillingCycle(verbose = false): BillingCycleResult {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();

  let invoicesGenerated = 0;
  let overdueInvoicesUpdated = 0;
  const errors: string[] = [];

  // 1. Process due subscriptions
  const dueSubscriptions = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE status = 'active' AND next_renewal_date <= ?
  `).all(today) as any[];

  for (const sub of dueSubscriptions) {
    try {
      // Check for duplicate invoice on same issue date
      const existing = db.prepare(`
        SELECT id FROM invoices 
        WHERE subscription_id = ? AND issue_date = ? AND status != 'cancelled'
      `).get(sub.id, today);

      if (existing) {
        if (verbose) console.log(`[Billing Engine] Skip sub ${sub.id}: already invoiced for ${today}`);
        continue;
      }

      // Generate invoice
      const invoiceCount = (db.prepare('SELECT COUNT(*) as count FROM invoices').get() as any).count + 1;
      const pad = String(invoiceCount).padStart(4, '0');
      const invoiceId = `inv-auto-${Date.now().toString().slice(-6)}-${pad}`;
      const invoiceNumber = `INV/${year}/${pad}`;
      const dueDate = addDays(today, 15);

      let items = [];
      try {
        items = JSON.parse(sub.line_items || '[]');
      } catch {
        items = [];
      }

      const invoiceItems = items.map((li: any, idx: number) => ({
        id: `inv-item-${Date.now()}-${idx}`,
        description: `${sub.plan_name} - ${li.productName || 'Subscription service'}`,
        quantity: li.quantity || 1,
        unitPrice: li.unitPrice || 0,
        taxRate: 18,
        taxAmount: Math.round(((li.total || 0) * 0.18) * 100) / 100,
        total: Math.round(((li.total || 0) * 1.18) * 100) / 100,
      }));

      const subtotal = sub.subtotal || 0;
      const taxAmount = sub.tax_amount || Math.round((subtotal * 0.18) * 100) / 100;
      const totalAmount = sub.total_amount || (subtotal + taxAmount);

      db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, subscription_id, subscription_number,
          customer_id, customer_name, customer_company, customer_email,
          issue_date, due_date, items, subtotal, discount_code, discount_amount,
          tax_amount, total_amount, paid_amount, outstanding_balance,
          status, payment_terms, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        invoiceNumber,
        sub.id,
        sub.subscription_number,
        sub.customer_id,
        sub.customer_name,
        sub.customer_company,
        sub.customer_email,
        today,
        dueDate,
        JSON.stringify(invoiceItems),
        subtotal,
        null,
        0,
        taxAmount,
        totalAmount,
        0,
        totalAmount,
        'posted',
        'Net 15 Days',
        `Automated recurring invoice for subscription ${sub.subscription_number}`,
        today,
        today
      );

      // Advance subscription next renewal date
      const nextRenewal = calculateNextDate(sub.next_renewal_date, sub.billing_cycle);
      db.prepare(`
        UPDATE subscriptions 
        SET next_renewal_date = ?, updated_at = ?
        WHERE id = ?
      `).run(nextRenewal, today, sub.id);

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, action, entity_type, entity_id, actor_id, actor_name, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        new Date().toISOString(),
        'AUTO_BILLING_INVOICE_GENERATED',
        'invoice',
        invoiceId,
        'system-billing-engine',
        'Automated Billing Engine',
        JSON.stringify({ subscriptionId: sub.id, invoiceNumber, amount: totalAmount })
      );

      invoicesGenerated++;
    } catch (err: any) {
      errors.push(`Error billing subscription ${sub.id}: ${err.message}`);
    }
  }

  // 2. Mark overdue invoices
  const overdueInvoices = db.prepare(`
    SELECT id, invoice_number, outstanding_balance FROM invoices
    WHERE status NOT IN ('paid', 'cancelled', 'overdue')
      AND due_date < ?
      AND outstanding_balance > 0
  `).all(today) as any[];

  for (const inv of overdueInvoices) {
    db.prepare(`
      UPDATE invoices
      SET status = 'overdue', updated_at = ?
      WHERE id = ?
    `).run(today, inv.id);

    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action, entity_type, entity_id, actor_id, actor_name, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      new Date().toISOString(),
      'INVOICE_MARKED_OVERDUE',
      'invoice',
      inv.id,
      'system-billing-engine',
      'Automated Billing Engine',
      JSON.stringify({ invoiceNumber: inv.invoiceNumber, outstandingBalance: inv.outstanding_balance })
    );

    overdueInvoicesUpdated++;
  }

  return {
    timestamp: new Date().toISOString(),
    processedSubscriptions: dueSubscriptions.length,
    invoicesGenerated,
    overdueInvoicesUpdated,
    errors,
  };
}
