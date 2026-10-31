import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './src/server/db.js';
import { router as apiRouter } from './src/server/routes.js';
import { runAutomatedBillingCycle } from './src/server/billingEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// The dev server must strictly run on port 3000 in AI Studio environment
const PORT = 3000;

// Initialize Database schema and seed data
initDatabase();

// Enable comprehensive CORS for AI Studio preview iframe and web clients
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SubscriptIQ Backend', timestamp: new Date().toISOString() });
});

// Explicit 404 for unhandled API requests to prevent falling back to Vite SPA HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// Periodic background billing runner (runs once every 5 minutes)
setInterval(() => {
  try {
    const result = runAutomatedBillingCycle(false);
    if (result.invoicesGenerated > 0) {
      console.log(`[Billing Engine Background] Generated ${result.invoicesGenerated} invoices automatically.`);
    }
  } catch (err) {
    console.error('[Billing Engine Background Error]:', err);
  }
}, 5 * 60 * 1000);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In dev mode, mount Vite middlewares dynamically
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubscriptIQ Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
