# FreshCart

A full-stack grocery e-commerce application built with **Next.js 14**, **MongoDB**, and **Tailwind CSS**.

---

## Quick Start (Docker)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 20+
- [Docker Compose](https://docs.docker.com/compose/) v2+

### 1. Clone & configure

```bash
git clone https://github.com/sumit-verma11/freshCart.git
cd freshCart
cp .env.example .env.local
```

Edit `.env.local` and set a strong `NEXTAUTH_SECRET`:

```bash
# Generate a secret
openssl rand -base64 32
```

### 2. Start

```bash
docker-compose up --build
# or
npm run docker:up
```

Docker will:
1. Start MongoDB
2. Build the Next.js app
3. Seed the database (products, categories, pincodes, users) on first boot
4. Start the app at **http://localhost:3000**

### 3. Stop

```bash
docker-compose down
# or
npm run docker:down
```

---

## Local Development (without Docker)

### Prerequisites
- Node 20+
- MongoDB running locally (or use the Docker MongoDB service)

```bash
# Start only MongoDB via Docker
docker-compose up mongodb -d

# Install deps
npm install

# Seed the database
npm run seed

# Start dev server
npm run dev
```

---

## Default Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@freshcart.com      | Admin@123  |
| User  | user@freshcart.com       | User@123   |
| User  | arjun@example.com        | Arjun@123  |
| User  | sunita@example.com       | Sunita@123 |
| User  | vikram@example.com       | Vikram@123 |
| User  | deepika@example.com      | Deep@123   |

Admin panel: **http://localhost:3000/admin**

---

## Serviceable Pincodes (for testing checkout)

| Pincode | Area              | City       | ETA      |
|---------|-------------------|------------|----------|
| 400001  | CST / Fort        | Mumbai     | 1–2 hrs  |
| 400051  | Bandra West       | Mumbai     | 1–3 hrs  |
| 110001  | Connaught Place   | New Delhi  | 2–4 hrs  |
| 560001  | MG Road           | Bangalore  | 2–4 hrs  |
| 600001  | Chennai GPO       | Chennai    | 2–4 hrs  |
| 700001  | Kolkata GPO       | Kolkata    | 3–6 hrs  |
| 500001  | Hyderabad GPO     | Hyderabad  | 2–4 hrs  |
| 411001  | Pune GPO          | Pune       | 2–3 hrs  |
| 380001  | Ahmedabad GPO     | Ahmedabad  | 3–5 hrs  |
| 302001  | Jaipur GPO        | Jaipur     | 3–6 hrs  |

---

## Module Overview

### Shop (Customer)

| Route               | Description                                        |
|---------------------|----------------------------------------------------|
| `/`                 | Homepage — featured products, categories           |
| `/category/[slug]`  | Products filtered by category                      |
| `/product/[slug]`   | Product detail — gallery, variants, add to cart    |
| `/cart`             | Cart with quantity controls and order summary      |
| `/checkout`         | 4-step checkout: pincode → address → review → COD  |
| `/orders`           | Order history with live delivery timeline          |
| `/orders?order=…`   | Post-checkout success banner                       |
| `/profile`          | Saved addresses, account details                   |
| `/categories`       | Browse all categories                              |

### Admin (`/admin`)

| Route                  | Description                                |
|------------------------|--------------------------------------------|
| `/admin`               | Dashboard — sales stats, recent orders     |
| `/admin/products`      | Product list, add / edit / delete          |
| `/admin/categories`    | Category & subcategory management          |
| `/admin/orders`        | Order list, update status                  |
| `/admin/pincodes`      | Serviceable pincode management             |

### Auth

| Route       | Description            |
|-------------|------------------------|
| `/login`    | Email + password login |
| `/register` | New account signup     |

---

## Tech Stack

| Layer       | Technology                                   |
|-------------|----------------------------------------------|
| Framework   | Next.js 14 (App Router, Server Components)   |
| Database    | MongoDB 7 + Mongoose 8                       |
| Auth        | NextAuth.js v4 (credentials provider)        |
| Styling     | Tailwind CSS 3                               |
| State       | Zustand (cart store)                         |
| Validation  | Zod                                          |
| UI Icons    | Lucide React                                 |
| Deployment  | Docker + Docker Compose                      |

---

## Environment Variables

| Variable               | Required | Description                              |
|------------------------|----------|------------------------------------------|
| `MONGO_URI`            | Yes      | MongoDB connection string                |
| `NEXTAUTH_SECRET`      | Yes      | Random secret for JWT signing            |
| `NEXTAUTH_URL`         | Yes      | Canonical app URL                        |
| `NEXT_PUBLIC_APP_NAME` | No       | Display name (default: FreshCart)        |
| `NEXT_PUBLIC_APP_URL`  | No       | Public URL (baked in at build time)      |

> **Note:** `NEXT_PUBLIC_*` variables are baked into the Next.js build. If you change them, rebuild the Docker image.

---

## Useful Commands

```bash
npm run dev          # Start dev server (hot reload)
npm run build        # Production build
npm run start        # Start production server
npm run seed         # Seed / re-seed database
npm run docker:up    # Build image + start all services
npm run docker:down  # Stop and remove containers
```

---

## Project Structure

```
freshcart/
├── app/
│   ├── (admin)/         # Admin panel pages + API
│   ├── (auth)/          # Login & register
│   ├── (shop)/          # Customer-facing pages
│   └── api/             # REST API routes
├── components/          # Shared UI components
├── lib/                 # DB connection, utilities, seed
├── models/              # Mongoose models
├── store/               # Zustand cart store
├── types/               # TypeScript interfaces
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
