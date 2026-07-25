# OpsPortal — Mini ERP + CRM Operations Portal

A full-stack ERP + CRM operations management platform designed for wholesale and distribution businesses. OpsPortal helps businesses manage customers, products, inventory, stock movements, sales challans, reports, analytics, and role-based business operations through a modern web application.

Built with **React + TypeScript** on the frontend, **Express.js REST API** on the backend, and **PostgreSQL (Supabase)** as the database.

---

# 🚀 Live Demo

## Frontend Application

https://ops-protal.vercel.app/

## Backend API (health check)

https://ops-protal-backend.onrender.com/api/health
---

# ✨ Key Features

* 🔐 JWT-based authentication
* 👥 Role-based access control

  * Admin
  * Sales
  * Warehouse
  * Accounts
* 📊 Business dashboard with KPIs
* 👤 Customer Relationship Management (CRM)
* 📦 Product management
* 📋 Inventory tracking
* 🔄 Stock movement audit logs
* 🚚 Sales challan creation and management
* 📈 Reports and analytics dashboard
* 💰 Accounts overview and business insights
* 🗄️ PostgreSQL database integration
* ☁️ Cloud deployment using Vercel, Render, and Supabase

---

# 🏗️ Deployment Architecture

```
                     Users
                       |
                       ↓

              Vercel Frontend
          React + TypeScript + Vite

                       |
                       ↓

              Render Backend
          Express.js REST API
          JWT Authentication

                       |
                       ↓

             Supabase PostgreSQL
              Database Storage
```

---

## Login Page

![Login](screenshots/login.png)

## Dashboard

![Dashboard](screenshots/dashboard.png)

## Customers

![Customers](screenshots/customers.png)

## Products

![Products](screenshots/products.png)

## Inventory

![Inventory](screenshots/inventory.png)

## Challans

![Challans](screenshots/challans.png)

---

# Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)              │
│  React 18 · TypeScript · Tailwind CSS · Lucide Icons     │
│  Inter font · Modern UI · Responsive Design              │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
               ▼                           ▼

┌──────────────────────┐      ┌───────────────────────────┐
│  Supabase JS Client  │      │  Express.js API Backend   │
│  Database Operations │      │  JWT Auth · bcrypt · pg   │
│  Row Level Security  │      │  REST APIs · RBAC         │
└──────────┬───────────┘      └──────────────┬────────────┘
           │                                  │
           ▼                                  ▼

┌──────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Supabase)            │
│ users · profiles · customers · notes                     │
│ products · stock_movements · challans · challan_items    │
│ Row Level Security Enabled                               │
└──────────────────────────────────────────────────────────┘
```

---

# Hybrid Architecture Approach

The application uses a hybrid architecture:

* **Supabase JS Client** handles direct database operations with Row Level Security.
* **Express.js Backend API** provides secure REST endpoints with JWT authentication, role-based authorization, and transactional business logic.

The backend provides production-ready APIs for secure business operations.

---

# Frontend

## Tech Stack

* React 18
* TypeScript
* Vite
* Tailwind CSS
* Lucide React Icons
* Inter Font

---

# Frontend Modules

### Login

* Email/password authentication
* Role-based user access

### Dashboard

* KPI overview
* Low-stock alerts
* Business summaries

### Customers

* Customer listing
* Customer details
* Follow-up notes
* Add/Edit/Delete operations

### Inventory

* Product stock levels
* Stock adjustment
* Reorder tracking
* Low-stock alerts

### Stock Movements

* Complete stock audit history
* IN/OUT tracking

### Sales Challans

* Create challans
* Product selection
* Stock validation
* Printable delivery challans

### Accounts Dashboard

* Revenue statistics
* Sales trends
* Customer analytics

### Reports

* Business performance insights
* Product analytics
* Stock health reports

---

# Role-Based Access Control

| Module     | Admin | Sales | Warehouse | Accounts |
| ---------- | ----- | ----- | --------- | -------- |
| Dashboard  | ✓     | ✓     | ✓         | ✓        |
| Customers  | ✓     | ✓     | -         | -        |
| Inventory  | ✓     | -     | ✓         | -        |
| Stock Logs | ✓     | -     | ✓         | -        |
| Challans   | ✓     | ✓     | -         | -        |
| Accounts   | ✓     | -     | -         | ✓        |
| Reports    | ✓     | ✓     | -         | ✓        |
| Settings   | ✓     | ✓     | ✓         | ✓        |

---

# Backend (Express.js)

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Supabase
* JWT Authentication
* bcryptjs Password Hashing
* pg Database Driver
* CORS Middleware

---

# Backend Structure

```
backend/
|
├── src/
│
├── server.js
├── seed.js
│
├── config/
│   ├── database.js
│   └── jwt.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── controllers/
│   ├── authController.js
│   ├── customerController.js
│   ├── productController.js
│   ├── stockController.js
│   ├── challanController.js
│   └── dashboardController.js
│
└── routes/
    ├── index.js
    ├── authRoutes.js
    ├── customerRoutes.js
    ├── productRoutes.js
    ├── stockRoutes.js
    └── challanRoutes.js
```

---

# REST API Endpoints

## Authentication

| Method | Endpoint             | Description    |
| ------ | -------------------- | -------------- |
| POST   | `/api/auth/register` | Create account |
| POST   | `/api/auth/login`    | Login user     |
| GET    | `/api/auth/profile`  | Get profile    |
| PUT    | `/api/auth/profile`  | Update profile |

---

## Customers

| Method | Endpoint                   | Description     |
| ------ | -------------------------- | --------------- |
| GET    | `/api/customers`           | Get customers   |
| POST   | `/api/customers`           | Create customer |
| PUT    | `/api/customers/:id`       | Update customer |
| DELETE | `/api/customers/:id`       | Delete customer |
| POST   | `/api/customers/:id/notes` | Add notes       |

---

## Products & Inventory

| Method | Endpoint                         | Description    |
| ------ | -------------------------------- | -------------- |
| GET    | `/api/products`                  | List products  |
| POST   | `/api/products`                  | Create product |
| PUT    | `/api/products/:id`              | Update product |
| DELETE | `/api/products/:id`              | Delete product |
| POST   | `/api/products/:id/adjust-stock` | Update stock   |

---

## Challans

| Method | Endpoint                   | Description    |
| ------ | -------------------------- | -------------- |
| GET    | `/api/challans`            | View challans  |
| POST   | `/api/challans`            | Create challan |
| PUT    | `/api/challans/:id/status` | Update status  |
| DELETE | `/api/challans/:id`        | Delete challan |

---

# Business Logic

## Stock Adjustment

* Uses database transactions
* Prevents negative stock
* Maintains stock movement history

## Challan Confirmation

When a challan is confirmed:

1. Validates available stock
2. Locks product rows
3. Deducts inventory
4. Creates stock movement logs
5. Commits transaction safely

## Authentication

* JWT token authentication
* Password hashing using bcrypt
* 7-day token expiry

## Authorization

Role-based middleware controls access to every protected route.

---

# Database Design

## Tables

| Table           | Purpose                |
| --------------- | ---------------------- |
| users           | Authentication data    |
| profiles        | User details and roles |
| customers       | CRM records            |
| customer_notes  | Follow-up history      |
| products        | Product catalogue      |
| stock_movements | Inventory audit        |
| challans        | Sales documents        |
| challan_items   | Challan products       |

---

# Setup Instructions

## Frontend

```bash
npm install

npm run dev
```

---

## Backend

```bash
cd backend

npm install

cp .env.example .env

npm run seed

npm run dev
```

Backend runs on:

```
http://localhost:4000
```

---

# Demo Accounts

| Email                                                       | Password | Role      |
| ----------------------------------------------------------- | -------- | --------- |
| [admin@opsportal.demo](mailto:admin@opsportal.demo)         | demo1234 | Admin     |
| [sales@opsportal.demo](mailto:sales@opsportal.demo)         | demo1234 | Sales     |
| [warehouse@opsportal.demo](mailto:warehouse@opsportal.demo) | demo1234 | Warehouse |
| [accounts@opsportal.demo](mailto:accounts@opsportal.demo)   | demo1234 | Accounts  |

---

# Technology Summary

| Layer          | Technology                 |
| -------------- | -------------------------- |
| Frontend       | React 18, TypeScript, Vite |
| UI             | Tailwind CSS               |
| Backend        | Node.js, Express.js        |
| Authentication | JWT, bcrypt                |
| Database       | PostgreSQL Supabase        |
| API            | REST API                   |
| Deployment     | Vercel + Render            |
| Icons          | Lucide React               |

---

# Future Improvements

* Invoice generation
* Email notifications
* Advanced sales forecasting
* Mobile application
* Document upload system
* AI-based business insights

---

# Author

**Hruthika Amara**

GitHub:
https://github.com/Hruthikaamara

```
```
