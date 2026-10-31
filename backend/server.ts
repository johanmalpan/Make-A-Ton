import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDatabase } from './src/db.js';
import { seedAllData } from './src/seed.js';
import { router as apiRouter } from './src/routes.js';
import { runAutomatedBillingCycle } from './src/billingEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Initialize Database schema
initDatabase();

// Auto-seed if database is brand new
try {
  const db = getDatabase();
  const customerCount = (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c;
  if (customerCount === 0) {
    console.log('[Startup] First run detected. Automatically seeding SQLite database...');
    seedAllData();
  }
} catch (err) {
  console.error('[Startup] Seed verification error:', err);
}

// Enable CORS for frontend Vite development server & external clients
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  })
);

app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Brightloop Enterprise Backend',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Explicit 404 for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Periodic background billing cycle runner (runs every 5 minutes)
const BILLING_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  try {
    const result = runAutomatedBillingCycle(false);
    if (result.invoicesGenerated > 0 || result.overdueInvoicesUpdated > 0) {
      console.log(
        `[Background Billing Engine] Generated ${result.invoicesGenerated} invoices, updated ${result.overdueInvoicesUpdated} overdue invoices.`
      );
    }
  } catch (err) {
    console.error('[Background Billing Engine Error]:', err);
  }
}, BILLING_INTERVAL_MS);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` Brightloop Enterprise Backend running at:`);
  console.log(` > Local:    http://localhost:${PORT}`);
  console.log(` > Health:   http://localhost:${PORT}/api/health`);
  console.log(` > Database: SQLite (Node.js native DatabaseSync)`);
  console.log(`=======================================================`);
});
