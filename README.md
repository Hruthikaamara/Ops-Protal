# OpsPortal — Mini ERP + CRM Operations Portal

A full-stack operations portal for a wholesale/distribution business. Built with **React + TypeScript** on the frontend, **Express.js** REST API on the backend, and **PostgreSQL** (Supabase) as the database.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  React 18 · TypeScript · Tailwind CSS · Lucide Icons      │
│  Inter font · Glass navbar · Dark sidebar                  │
└──────────────┬───────────────────────────┬────────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────┐      ┌──────────────────────────────┐
│  Live: Supabase JS   │      │  Submission: Express.js API  │
│  Client (anon key)   │      │  JWT Auth · bcrypt · pg      │
│  Direct DB access    │      │  REST endpoints · RBAC       │
└──────────┬───────────┘      └──────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Supabase)                           │
│  profiles · users · customers · customer_notes               │
│  products · stock_movements · challans · challan_items       │
│  RLS enabled on all tables                                   │
└─────────────────────────────────────────────────────────────┘
```

### Hybrid Approach

The app runs live using **Supabase's JS client** (direct database access with Row Level Security). The **Express.js backend** is included for submission/grading purposes — it provides a complete REST API with JWT authentication, role-based access control, and transactional business logic.

---

## Frontend

### Tech Stack
- **React 18** with TypeScript
- **Vite** build tool
- **Tailwind CSS** with custom design system
- **Lucide React** icons
- **Inter** font (Google Fonts)

### Design System
| Token       | Value     |
|-------------|-----------|
| Primary     | #4F46E5   |
| Sidebar     | #111827   |
| Background  | #F8FAFC   |
| Success     | #10B981   |
| Warning     | #F59E0B   |
| Danger      | #EF4444   |

### Pages
1. **Login** — Email/password auth with demo accounts
2. **Dashboard** — Role-based KPI overview, low-stock alerts, follow-ups
3. **Customers** — CRM list, detail (with notes timeline), add/edit forms
4. **Inventory** — Product list, stock levels, reorder thresholds, low-stock alerts, stock adjustment
5. **Stock Movements** — Full audit log of all stock IN/OUT changes
6. **Sales Challans** — List, creation form with product picker, printable delivery challan
7. **Accounts Dashboard** — Revenue stats, 6-month trend chart, top customers, transactions
8. **Reports & Analytics** — KPI summary, sales performance, top products, customer distribution, stock health
9. **Account Settings** — View profile, change role, update name/phone

### Role-Based Access
| Module       | Admin | Sales | Warehouse | Accounts |
|-------------|-------|-------|-----------|----------|
| Dashboard   | ✓     | ✓     | ✓         | ✓        |
| Customers   | ✓     | ✓     | —         | —        |
| Inventory   | ✓     | —     | ✓         | —        |
| Stock Logs  | ✓     | —     | ✓         | —        |
| Challans    | ✓     | ✓     | —         | —        |
| Accounts    | ✓     | —     | —         | ✓        |
| Reports     | ✓     | ✓     | —         | ✓        |
| Settings    | ✓     | ✓     | ✓         | ✓        |

---

## Backend (Express.js)

### Tech Stack
- **Node.js** + **Express.js**
- **JWT** authentication with **bcryptjs** password hashing
- **pg** (node-postgres) for database access
- **CORS** + error handling middleware

### Directory Structure
```
backend/
├── src/
│   ├── server.js              # Express app entry point
│   ├── seed.js                # Demo data seeder
│   ├── config/
│   │   ├── database.js        # PostgreSQL connection pool
│   │   └── jwt.js             # JWT token generation/verification
│   ├── middleware/
│   │   ├── auth.js            # authenticate() + authorize() RBAC
│   │   └── errorHandler.js   # Centralized error handling
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── productController.js
│   │   ├── stockController.js
│   │   ├── challanController.js
│   │   └── dashboardController.js
│   └── routes/
│       ├── index.js           # Route aggregator
│       ├── authRoutes.js
│       ├── customerRoutes.js
│       ├── productRoutes.js
│       ├── stockRoutes.js
│       ├── challanRoutes.js
│       └── dashboardRoutes.js
├── migrations/
│   └── 001_express_auth_schema.sql
├── package.json
└── .env.example
```

### REST API Endpoints

#### Authentication
| Method | Endpoint              | Description           | Auth |
|--------|----------------------|-----------------------|------|
| POST   | /api/auth/register   | Create account + JWT  | No   |
| POST   | /api/auth/login      | Login + JWT           | No   |
| GET    | /api/auth/profile    | Get current user       | Yes  |
| PUT    | /api/auth/profile    | Update profile/role   | Yes  |

#### Customers
| Method | Endpoint                    | Description          | Roles         |
|--------|----------------------------|----------------------|---------------|
| GET    | /api/customers             | List + search/filter | admin, sales  |
| GET    | /api/customers/:id         | Get with notes       | admin, sales  |
| POST   | /api/customers             | Create               | admin, sales  |
| PUT    | /api/customers/:id         | Update               | admin, sales  |
| DELETE | /api/customers/:id         | Delete               | admin, sales  |
| POST   | /api/customers/:id/notes   | Add follow-up note   | admin, sales  |
| DELETE | /api/customers/:id/notes/:noteId | Delete note    | admin, sales  |

#### Products & Inventory
| Method | Endpoint                       | Description          | Roles             |
|--------|-------------------------------|----------------------|-------------------|
| GET    | /api/products                 | List + search/filter | admin, warehouse  |
| GET    | /api/products/:id             | Get single           | admin, warehouse  |
| POST   | /api/products                 | Create               | admin, warehouse  |
| PUT    | /api/products/:id             | Update               | admin, warehouse  |
| DELETE | /api/products/:id             | Delete               | admin, warehouse  |
| POST   | /api/products/:id/adjust-stock| Adjust stock (IN/OUT)| admin, warehouse  |

#### Stock Movements
| Method | Endpoint                | Description      | Roles             |
|--------|------------------------|------------------|-------------------|
| GET    | /api/stock-movements   | List all (filter) | admin, warehouse |

#### Sales Challans
| Method | Endpoint                   | Description                    | Roles        |
|--------|---------------------------|--------------------------------|--------------|
| GET    | /api/challans             | List + search/filter           | admin, sales |
| GET    | /api/challans/:id         | Get with line items            | admin, sales |
| POST   | /api/challans             | Create (Draft or Confirmed)    | admin, sales |
| PUT    | /api/challans/:id/status  | Confirm/Cancel (deducts stock) | admin, sales |
| DELETE | /api/challans/:id         | Delete                         | admin, sales |

#### Dashboard & Reports
| Method | Endpoint                   | Description          | Roles                      |
|--------|---------------------------|----------------------|----------------------------|
| GET    | /api/dashboard            | KPI stats            | all                        |
| GET    | /api/reports/overview     | Analytics data       | admin, accounts, sales     |
| GET    | /api/accounts/overview     | Financial summary    | admin, accounts            |

### Business Logic

1. **Stock Adjustment** — Uses a database transaction with `FOR UPDATE` row locking to prevent race conditions. Validates that stock doesn't go negative.

2. **Challan Confirmation** — When a challan is confirmed, the system atomically:
   - Validates sufficient stock for each line item (with row locks)
   - Deducts stock from each product
   - Logs a stock movement for each item
   - All within a single transaction (rollback on any failure)

3. **JWT Authentication** — Bearer token auth with 7-day expiry. Passwords hashed with bcrypt (10 salt rounds).

4. **Role-Based Access Control** — Each route specifies allowed roles via the `authorize()` middleware.

---

## Database

### Schema (7 tables + 1 auth table)

| Table             | Purpose                              |
|-------------------|--------------------------------------|
| `users`           | Express auth (email + password hash) |
| `profiles`        | User display info + role              |
| `customers`       | CRM customer records                  |
| `customer_notes`  | Follow-up note timeline               |
| `products`        | Product catalog + stock levels        |
| `stock_movements` | Audit log of all stock changes        |
| `challans`        | Sales challan headers                 |
| `challan_items`   | Line items (snapshot of product data) |

### Row Level Security
All tables have RLS enabled with `anon + authenticated` policies for full CRUD (internal multi-role app, no per-user isolation needed).

---

## Setup

### Frontend (live version)
```bash
npm install
npm run dev
```

### Backend (submission version)
```bash
cd backend
npm install
cp .env.example .env   # Edit with your DB credentials
npm run seed           # Optional: seed demo data
npm run dev            # Start on port 4000
```

### Demo Accounts
| Email                      | Password   | Role      |
|----------------------------|------------|-----------|
| admin@opsportal.demo       | demo1234   | Admin     |
| sales@opsportal.demo       | demo1234   | Sales     |
| warehouse@opsportal.demo   | demo1234   | Warehouse |
| accounts@opsportal.demo    | demo1234   | Accounts  |

---

## Tech Stack Summary

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS      |
| Backend     | Node.js, Express.js, JWT, bcryptjs            |
| Database    | PostgreSQL (Supabase)                         |
| Icons       | Lucide React                                  |
| Font        | Inter (Google Fonts)                          |
