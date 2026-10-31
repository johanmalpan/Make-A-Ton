# Brightloop Subscription Management System
> Unified Enterprise Platform for Plans, Subscriptions, Recurring Billing, Invoicing, Payments, and Financial Reporting.  
> Built for **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**.

---

## 🌟 Architecture Overview

```
mkton/
├── backend/                       # Express + SQLite Backend API
│   ├── src/
│   │   ├── db.ts                 # SQLite schema, tables, queries (node:sqlite native)
│   │   ├── seed.ts               # Database auto-seed with enterprise mock dataset
│   │   ├── billingEngine.ts      # Automated recurring billing cycle runner & overdue detection
│   │   └── routes.ts             # RESTful API endpoints (/api/*)
│   ├── server.ts                 # Express server with CORS & background cron runner
│   ├── package.json              # Backend dependencies
│   └── tsconfig.json
│
├── frontend/                      # React 19 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/           # UI components, modals, navigation & layout
│   │   ├── pages/                # Dashboard, Subscriptions, Invoices, Customers, etc.
│   │   ├── services/             # Client services connected to backend via api.ts
│   │   │   ├── api.ts            # Centralized API fetch wrapper with offline fallback
│   │   │   ├── customerService.ts
│   │   │   ├── subscriptionService.ts
│   │   │   ├── invoiceService.ts
│   │   │   ├── paymentService.ts
│   │   │   ├── quotationService.ts
│   │   │   ├── planService.ts
│   │   │   └── productService.ts
│   │   ├── types/                # Strongly-typed TypeScript interfaces
│   │   └── utils/                # Financial, GST tax, and currency helpers
│   ├── vite.config.ts            # Vite config with /api reverse proxy to port 5000
│   └── package.json
│
├── package.json                   # Root workspace orchestration (concurrent runner)
└── README.md                      # Full project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v20+ (recommended v22 or v24)
- **npm** or **bun** / **yarn**

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 3. Run the Fullstack Stack (Frontend + Backend)
From the root directory:
```bash
# Starts both Backend (Port 5000) and Frontend (Port 3000) concurrently
npm run dev
```

Or run each independently:
```bash
# Terminal 1 - Start Backend API
npm run dev:backend

# Terminal 2 - Start Frontend UI
npm run dev:frontend
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/customers` | List all enterprise customers |
| `POST` | `/api/customers` | Create a new customer |
| `GET` | `/api/products` | List all software & service products |
| `GET` | `/api/plans` | List subscription plans & billing cycles |
| `GET` | `/api/subscriptions` | List active & past-due subscriptions |
| `POST` | `/api/subscriptions` | Create a subscription |
| `PATCH` | `/api/subscriptions/:id/status` | Update subscription status |
| `GET` | `/api/quotations` | List quotations / sales orders |
| `POST` | `/api/quotations/:id/convert` | Convert quotation to active subscription |
| `GET` | `/api/invoices` | List generated invoices |
| `POST` | `/api/invoices/:id/pay` | Record a payment against an invoice |
| `GET` | `/api/payments` | List payment ledger records |
| `GET` | `/api/metrics` | Calculate MRR, ARR, active subs & overdue balance |
| `POST` | `/api/billing-cycle/run` | Trigger automated recurring billing engine |
| `GET` | `/api/audit-logs` | View system compliance & billing audit logs |

---

## ⚙️ Automated Billing Engine

The built-in billing engine (`backend/src/billingEngine.ts`) runs periodically in the background:
1. **Recurring Invoicing**: Automatically detects active subscriptions whose `next_renewal_date <= today`, calculates item subtotals, GST tax, and generates posted invoices with 15-day payment terms.
2. **Cycle Advance**: Advances renewal dates based on interval (`daily`, `weekly`, `monthly`, `yearly`).
3. **Overdue Status Transition**: Checks unpaid invoices past their `due_date` and transitions them to `overdue`.
4. **Audit Trails**: Logs all billing events into the SQLite `audit_logs` table for compliance.

---

## 🔒 Git Contribution Workflow

To push contributions to the team repository from your personal GitHub account:
```bash
# 1. Ensure your git identity is configured
git config user.name "gokulkrishnack6-wq"
git config user.email "gokulkrishnack6@gmail.com"

# 2. Push feature branch
git push -u origin feature/backend-integration
```
