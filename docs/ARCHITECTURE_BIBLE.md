# WAY TECH — STOCKFLOW SYSTEM-WIDE ARCHITECTURE & DESIGN BIBLE
## Version: 2.0 (Production-Ready Spec)
## Author: Principal Solution Architect & Design System Lead
## Target Horizon: 5-Year Enterprise SaaS Scalability

---

## 1. ARCHITECTURE OVERVIEW

WAY TECH’s "StockFlow" is an enterprise-grade, multi-tenant SaaS business management platform designed to support thousands of small-to-medium businesses (tenants). The system provides core workflows for real-time inventory tracking, point-of-sale (POS) processing, expense logging, customer/supplier relationship management, employee access control, and executive-level analytics reporting.

### 1.1 High-Level System Topology
The platform operates on a modernized, headless, decoupled three-tier hybrid serverless and micro-services architecture:

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   +--------------------------+  +---------------------------+  +------------+   |
|   |     Web App (React/Vite) |  |   POS Terminal Client     |  | Mobile App |   |
|   +--------------------------+  +---------------------------+  +------------+   |
+---------------------------------------+-----------------------------------------+
                                        | (HTTPS/WSS)
                                        v
+---------------------------------------------------------------------------------+
|                               EDGE & GATEWAY LAYER                              |
|   +-------------------------------------------------------------------------+   |
|   |                  Cloud DNS & Cloud CDN (Global Edge)                    |   |
|   +-------------------------------------------------------------------------+   |
|   |                       API Gateway / Reverse Proxy                       |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------+-----------------------------------------+
                                        |
                  +---------------------+---------------------+
                  | (Internal REST / gRPC)                    | (Native Firebase SDK)
                  v                                           v
+--------------------------------------+   +--------------------------------------+
|        APPLICATION SERVICE LAYER     |   |          CLOUD SERVICES LAYER        |
|  +---------------------------------+ |   |  +---------------------------------+ |
|  | Express Backend (API/Auth/POS)  | |   |  | Firebase Authentication (OIDC)  | |
|  +---------------------------------+ |   |  +---------------------------------+ |
|  | Analytics & Aggregator Engine   | |   |  | Cloud Functions (Workers/Jobs)  | |
|  +---------------------------------+ |   |  +---------------------------------+ |
|  | Audit Logger Service            | |   |  | Cloud Pub/Sub (Event Broker)    | |
|  +---------------------------------+ |   |  +---------------------------------+ |
+------------------+-------------------+   +------------------+-------------------+
                   |                                          |
                   | (SQL Queries / PG Pool)                  | (NoSQL Firestore Protocol)
                   v                                          v
+--------------------------------------+   +--------------------------------------+
|         RELATIONAL STORAGE           |   |          DOCUMENT COLD/REAL-TIME     |
|  +---------------------------------+ |   |  +---------------------------------+ |
|  | Cloud SQL PostgreSQL            | |   |  | Cloud Firestore (Enterprise)    | |
|  | - Core transaction ledgers      | |   |  | - Live inventory streams        | |
|  | - Tenant billing details        | |   |  | - Staged offline sync logs      | |
|  +---------------------------------+ |   |  +---------------------------------+ |
+--------------------------------------+   +--------------------------------------+
```

### 1.2 Component Communication and Data Flow
1. **Edge Routing**: All static UI requests hit Cloud CDN. API requests are routed through the Google Cloud Load Balancer (GCLB) acting as an API Gateway, distributing traffic to containerized application nodes running in Cloud Run.
2. **Real-time Synchronicity**: Client terminals (such as local POS registers) establish long-lived Firestore connections (`onSnapshot`) to capture atomic stock updates, price sheets, and menu shifts with sub-second latency.
3. **Write Path & Relational Offloading**:
   - High-throughput operational writes (POS transactions, sales logs, stock level decrements) hit the application service.
   - The application service validates schema constraints, updates Firestore for live UI synchronization, and publishes a transaction event to **Cloud Pub/Sub**.
   - A dedicated consumer logs the persistent transaction into **Cloud SQL (PostgreSQL)** for financial auditing, reporting, and reconciliation.
4. **Read Path & Aggregation**:
   - Live panels fetch low-latency documents from Firestore.
   - Complex historical charts, P&L statements, and multi-tenant billing calculations bypass NoSQL limitations and query indexed materialized views on Cloud SQL.

---

## 2. TECHNOLOGY STACK RECOMMENDATIONS

| Layer | Recommended Choice | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite 8** | High performance, rapid builds, type-stripping support, active component ecosystems, and modular bundle splitting. |
| **Styling Engine** | **Tailwind CSS v4** | Compiled utility classes, CSS variable-based `@theme` declarations, high-speed CSS optimization, and absolute layout responsiveness. |
| **State Management** | **Zustand + React Context** | Standardized, low-boilerplate, atomic state updates. Context handles runtime business scopes; Zustand handles ephemeral global client states. |
| **Backend Runtime** | **Node.js (TypeScript/Express)** | Event-driven, scalable, shared TS data contracts between frontend/backend, high-speed JSON processing. |
| **Primary Database** | **Firestore (Enterprise)** | Native client-side real-time synchronization, offline support out of the box, linear scaling, and client-direct secure writes. |
| **Relational Database** | **Cloud SQL PostgreSQL** | Fully managed relational system supporting multi-tenant indexes, analytical aggregation, and financial transaction isolation (ACID). |
| **File Storage** | **Cloud Storage (GCS)** | Object-locked bucket structure supporting fine-grained IAM controls, signed URLs for receipt PDFs, and optimized image processing. |
| **Monitoring / CDN** | **Sentry + GCP Cloud Trace** | Fine-grained performance profiling, edge-caching configurations, and error boundary event logging. |

---

## 3. MULTI-TENANT DATABASE & ARCHITECTURE

The success of WAY TECH as a SaaS platform hinges on absolute isolation between company accounts, zero risk of data leakage, and cost-effective database scaling.

### 3.1 Tenant Isolation Strategies Comparison
We evaluate three classic multi-tenant models:

1. **Shared Database + Tenant ID (Logical Separation)**:
   - *Pros*: Lowest infrastructure cost, easiest to deploy, unified backups, trivial globally shared schemas.
   - *Cons*: Risk of "noisy neighbor" queries, potential data leaks if query constraints are omitted, database-level locking during massive schema changes.
2. **Separate Database Per Tenant (Physical Separation)**:
   - *Pros*: Maximum isolation, absolute tenant-specific encryption keys, zero noisy-neighbor performance impact.
   - *Cons*: Astronomical infrastructure cost, extreme operational complexity managing thousands of schema migrations, difficult to run global SaaS analytics.
3. **Hybrid Model (Dynamic Shared / Partitioned)**:
   - *Pros*: Combines logical separation with physical tenant routing for enterprise-tier accounts. Small tenants share instances using strict schema-level row filters; high-revenue enterprise tenants receive dedicated physical database instances.

### 3.2 Chosen Approach: Hybrid Model (Shared Cloud SQL + Multi-Tenant Firestore Subcollections)
For WAY TECH, we enforce a **real-time/operational hybrid multi-tenant structure**:

- **Real-Time Client Operations (Firestore)**:
  - We use a **subcollection isolation strategy** matching the current codebase pattern:
    `/businesses/{businessId}/products/{productId}`
    `/businesses/{businessId}/sales/{saleId}`
  - No client-side code can query a generic `/products` collection. The path is physically prefixed with `{businessId}` (the tenant scope), allowing Firestore's security rules engine to natively deny cross-tenant operations before execution.
- **Relational Operations (Cloud SQL)**:
  - Shared PostgreSQL cluster with **Row-Level Security (RLS)** active on every table.
  - Every SQL table must contain a non-nullable `tenant_id` column.
  - PostgreSQL role parameters are configured at the transaction pool level to inject the current request's tenant ID, preventing any query from scanning other tenant rows.

```sql
-- Enforcing PostgreSQL Row-Level Security for Way Tech Tenants
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_sales_isolation_policy ON sales
    USING (tenant_id = current_setting('app.current_tenant_id'));
```

---

## 4. DATABASE SCHEMA DESIGN

The relational and document database structures are designed to guarantee ACID transactions, zero orphans, and linear indexing speeds.

### 4.1 SQL Relational Model (Cloud SQL PostgreSQL)

```
                       +-------------+
                       |   Tenants   |
                       +------+------+
                              | 1
                              |
                              | 1..*
                       +------+------+
                       |   Branches  |
                       +------+------+
                              | 1
                              |
                              | 1..*
                       +------+------+
                       |    Users    |
                       +------+------+
                              | 1
                              |
              +---------------+---------------+
              | 1..*                          | 1..*
       +------+------+                 +------+------+
       |   Products  |                 |  Customers  |
       +------+------+                 +------+------+
              | 1                             | 1
              |                               |
              | 1..*                          | 1..*
       +------+------+                 +------+------+
       | Stock Moves |                 |    Orders    |
       +-------------+                 +------+------+
                                              | 1
                                              |
                                              | 1..*
                                       +------+------+
                                       | Order Items |
                                       +-------------+
```

#### Table: tenants
Stores SaaS account profiles, billing packages, and core metadata.
- `id` (UUID, Primary Key)
- `company_name` (VARCHAR(150), Not Null)
- `logo_url` (VARCHAR(2048))
- `plan_tier` (VARCHAR(50), DEFAULT 'starter', Constraint: IN ('starter', 'growth', 'enterprise'))
- `status` (VARCHAR(30), DEFAULT 'active')
- `created_at` (TIMESTAMP WITH TIME ZONE, Not Null)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

#### Table: branches
Supports multi-location tracking for retail/F&B.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key referencing tenants(id), On Delete Cascade)
- `name` (VARCHAR(100), Not Null)
- `address` (TEXT, Not Null)
- `phone` (VARCHAR(30))
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP WITH TIME ZONE, Not Null)

#### Table: users
Unified user record.
- `id` (VARCHAR(128), Primary Key) -- Maps directly to Firebase Auth UID
- `tenant_id` (UUID, Foreign Key referencing tenants(id))
- `branch_id` (UUID, Foreign Key referencing branches(id))
- `email` (VARCHAR(255), Unique, Not Null)
- `full_name` (VARCHAR(150), Not Null)
- `role_id` (VARCHAR(50), Not Null, Foreign Key to roles(id))
- `status` (VARCHAR(30), DEFAULT 'active')

#### Table: products
Core inventory catalog definition.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key referencing tenants(id))
- `sku` (VARCHAR(100), Unique within tenant scope)
- `barcode` (VARCHAR(100))
- `name` (VARCHAR(200), Not Null)
- `description` (TEXT)
- `price` (NUMERIC(12,2), Not Null)
- `cost` (NUMERIC(12,2), Not Null)
- `category_id` (UUID)
- `status` (VARCHAR(30), DEFAULT 'active')

#### Table: inventory
Current stock level at branch level.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `branch_id` (UUID, Foreign Key referencing branches(id))
- `product_id` (UUID, Foreign Key referencing products(id))
- `quantity` (NUMERIC(12,3), Not Null, DEFAULT 0.000)
- `low_stock_threshold` (NUMERIC(12,3), DEFAULT 5.000)

#### Table: stock_movements
Ledger for tracking adjustments, returns, purchases, and sales.
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `product_id` (UUID, Foreign Key referencing products(id))
- `branch_id` (UUID, Foreign Key referencing branches(id))
- `quantity` (NUMERIC(12,3), Not Null) -- Positive for incoming, negative for outgoing
- `movement_type` (VARCHAR(50), Constraint: IN ('sale', 'purchase', 'return', 'adjustment', 'transfer'))
- `reference_id` (VARCHAR(128)) -- Links to order_id or purchase_order_id
- `created_at` (TIMESTAMP WITH TIME ZONE)

---

## 5. AUTHENTICATION & SECURITY ARCHITECTURE

WAY TECH’s authentication system utilizes a **Zero-Trust Token and Session model** backed by Firebase Auth and logical role check layers on both client and backend servers.

### 5.1 Role-Based Access Control (RBAC) Matrix
The application supports four standard user roles. Permissions are validated down to the endpoint execution and the Firestore operation block.

| Role | Company Settings | Manage Users | Financial Analytics | Manage Products | Create Sales / POS |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Owner** | Yes (Read/Write) | Yes (Read/Write) | Yes (Read) | Yes (Read/Write) | Yes (Read/Write) |
| **Admin** | No | Yes (Read/Write) | No | Yes (Read/Write) | Yes (Read/Write) |
| **Manager** | No | No | Limited Reports | Yes (Read/Write) | Yes (Read/Write) |
| **Employee**| No | No | No | No (Read Only) | Yes (Write Only) |

### 5.2 Password Security and Multi-Factor Rules
- **Direct Auth Offloading**: Password hashing, brute force protection, and credential recycling are offloaded to **Firebase Identity Platform**.
- **Hashing Standard**: Passwords are saved utilizing **Scrypt** with a high cost-factor.
- **Complexity Requirements**: Enforced on the signup screen: minimum 10 characters, 1 uppercase, 1 lowercase, 1 number, and 1 non-alphanumeric character.
- **Session Lifecycles**:
  - Access Token (JWT): Valid for **1 Hour**. Automatically refreshed by client-side SDK.
  - Refresh Token: Persisted in secure HTTP-only, SameSite=Strict, Secure cookies, valid for **30 Days**.
  - Terminals / POS registers: Require automatic lock screens after 15 minutes of inactivity.

---

## 6. BACKEND ARCHITECTURE & API DESIGN

The Node/Express backend operates on a domain-driven, layer-isolated design. No router file bypasses validation middleware, and no service bypasses tenancy checks.

### 6.1 Modular Directory Architecture
```
backend/
├── src/
│   ├── app.ts                  # App bootstrapper
│   ├── server.ts               # Listener binding to Port 3000
│   ├── middleware/             # Shared middleware layers
│   │   ├── auth.middleware.ts  # Token validation & Tenant extraction
│   │   ├── rbac.middleware.ts  # Role permission gatekeeping
│   │   ├── rate-limit.ts       # Rate limiter
│   │   └── error.handler.ts    # Global error response transformer
│   ├── modules/                # Feature-driven business modules
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── sales/
│   │   │   ├── sales.controller.ts
│   │   │   ├── sales.service.ts
│   │   │   ├── sales.routes.ts
│   │   │   └── sales.validator.ts
│   │   └── reports/
│   └── utils/
```

### 6.2 API Gateway Request Flow Pipeline
```
Client Request
      │
      ▼
Edge CDN / Rate Limiter (IP-based)
      │
      ▼
Bearer Token Verification (Verify Firebase OIDC Signature)
      │
      ▼
Tenant Verification (Extract tenant_id from user metadata)
      │
      ▼
RBAC Guard (Match Route requirements with user.role)
      │
      ▼
Schema Validation (Zod Validation of request payload)
      │
      ▼
Controller execution -> Service -> DB Write
```

### 6.3 REST API Design Specs
All endpoints utilize semantic versioning prefixed with `/api/v1`.

#### Standard Request Headers
```http
Authorization: Bearer <JWT_Token>
X-Tenant-Id: <UUID_Tenant_Context>
Content-Type: application/json
```

#### API Endpoint Index
- `POST /api/v1/auth/register` (Public: Registers Tenant, Admin User, and Branch)
- `POST /api/v1/auth/login` (Public: Verifies credentials, returns session cookies)
- `GET /api/v1/inventory/status` (Requires: `read:inventory`)
- `POST /api/v1/sales/order` (Requires: `write:sales`)
- `GET /api/v1/reports/revenue` (Requires: `read:reports`)

---

## 7. FRONTEND ARCHITECTURE & DESIGN SYSTEM

### 7.1 Scalable Feature-Based Directory Structure
```
src/
├── app/                  # Route configurations and app bootstrap
├── assets/               # Fonts, optimized vectors, default illustrations
├── components/           # Generic visual components
│   ├── ui/               # Atom level: Button, Input, Modal, Table
│   ├── layout/           # Frame structures: Sidebar, Navbar, Footer
│   └── shared/           # Compound UI modules: TableFilters, SearchBar
├── features/             # Scalable, self-contained business modules
│   ├── dashboard/        # Stats, charts, recent logs
│   ├── inventory/        # Stock levels, catalog lists
│   ├── pos/              # Visual sales grid, cart, payments
│   └── reports/          # Materialized graph sheets, exports
├── hooks/                # Reusable global hooks (useDebounce, useMediaQuery)
├── services/             # Clean client wrapper classes for direct APIs
├── context/              # App contexts (Theme, Auth, Business)
├── lib/                  # Library bindings (firebase configs, tailwind helpers)
├── utils/                # Pure formatting and pure math utilities
└── types/                # Strict global TypeScript interfaces
```

### 7.2 Design System Tokens & Styling Palette

```
🎨 WAY TECH BRAND PALETTE (Dark & Slate Theme Matrix)
┌────────────────────────────────────────────────────────┐
│  --bg:           #0f172a (Deep Slate Blue)              │
│  --bg-card:      #1e293b (Rich Charcoal Card)           │
│  --border:       #334155 (Subtle Divider Line)          │
│  --text-1:       #f8fafc (Crisp Titanium White)         │
│  --text-2:       #94a3b8 (Soft Blueprint Gray)          │
│  --text-3:       #64748b (Slate Muted Gray)             │
│  --accent:       #06b6d4 (Vibrant Neon Cyan)            │
│  --accent-dim:   #06b6d415 (Cyan glow backlight)        │
│  --success:      #10b981 (Emerald green success)        │
│  --warning:      #f59e0b (Amber caution warning)        │
│  --error:        #ef4444 (Crimson red alert)            │
└────────────────────────────────────────────────────────┘
```

#### Typography Scale
- Font Pairings: **Space Grotesk** (Display Headings, Tech Accents) + **Inter** (Dense UI body copy, fast reading)
- Sizes:
  - Heading 1: `text-2xl font-bold tracking-tight text-white` (Mobile: `text-xl`)
  - Subhead: `text-sm font-medium text-slate-400`
  - Body: `text-sm leading-relaxed text-slate-300`
  - Data / Code: `font-mono text-xs text-slate-400`

#### Component Layout Rules
1. **Desktop Layout**: Collapsible Sidebar (Width: `240px`), persistent Header with Tenant Switcher, flex-growing main view restricted to `max-w-7xl mx-auto px-6`.
2. **Mobile Layout**: Dynamic bottom bar navigation, full-width content cards stack vertically, overflow items slide horizontally inside scroll blocks.

---

## 8. DASHBOARD MODULE DESIGN

The dashboard represents the core analytical nervous system of StockFlow. It dynamically adapts based on the active tenancy and the logging-in user's role permissions.

### 8.1 KPI Definitions & Calculations
```
                               📊 DASHBOARD KPI MATRIX
┌──────────────────────────────────────────────────────────────────────────┐
│  Sales Revenue  = SUM(sales.total) over active accounting period         │
│  Product Cost   = SUM(sales.quantity * product.cost)                     │
│  Net Expenses   = SUM(expenses.amount)                                   │
│  Net Profit     = Sales Revenue - Product Cost - Net Expenses            │
│  Profit Margin  = (Net Profit / Sales Revenue) * 100                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Live Dashboard Widget Catalog
1. **Sales Summary Card**: Real-time sales ticker showing day-to-day revenue variations.
2. **Profitability Chart**: Area chart showing revenue vs costs over the current month.
3. **Recent POS Transactions**: Data-table syncing instant sales directly from terminals.
4. **Low Stock Warnings**: Banner indicating items whose current inventory falls below their set threshold, equipped with a one-click purchase order trigger.
5. **Top Product Performance**: Horizontal bar chart outlining highest volume categories.

### 8.3 Performance Optimization & Rendering Strategy
- **Aggregated View Caching**: Dashboard states are cached inside Redis on the server. Every sale event publishes a dirty-bit invalidate token to Pub/Sub to trigger background recalculation.
- **Client-Side Real-Time Throttling**: The dashboard uses a 5-second query throttle on the main `onSnapshot` data stream to prevent excessive UI re-renders and save mobile client battery life.

---

## 9. FIRESTORE SECURITY RULES (THE "FORTRESS" POLICY)

The complete security specification, matching our Multi-Tenant and RBAC architectural blueprint. These rules protect all subcollections within the system.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for auth verification
    function isSignedIn() {
      return request.auth != null;
    }

    function isEmailVerified() {
      return isSignedIn() && request.auth.token.email_verified == true;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    // Default global deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    // Master business document validation
    match /businesses/{businessId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if false; // Require enterprise support tier for tenant deletion

      // Nested Subcollections (Subcollection isolation)
      match /periods/{periodId} {
        allow read: if isSignedIn() && isValidId(periodId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(periodId);
      }

      match /products/{productId} {
        allow read: if isSignedIn() && isValidId(productId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(productId);
      }

      match /sales/{saleId} {
        allow read: if isSignedIn() && isValidId(saleId);
        allow create: if isSignedIn() && isEmailVerified() && isValidId(saleId);
        allow update, delete: if false; // Sales logs are persistent ledger entries (Immutable)
      }

      match /expenses/{expenseId} {
        allow read: if isSignedIn() && isValidId(expenseId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(expenseId);
      }

      match /customers/{customerId} {
        allow read: if isSignedIn() && isValidId(customerId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(customerId);
      }

      match /suppliers/{supplierId} {
        allow read: if isSignedIn() && isValidId(supplierId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(supplierId);
      }
    }
    
    // Support parallel template structures
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if false;

      match /periods/{periodId} {
        allow read: if isSignedIn() && isValidId(periodId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(periodId);
      }
      match /products/{productId} {
        allow read: if isSignedIn() && isValidId(productId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(productId);
      }
      match /sales/{saleId} {
        allow read: if isSignedIn() && isValidId(saleId);
        allow create: if isSignedIn() && isEmailVerified() && isValidId(saleId);
        allow update, delete: if false;
      }
      match /expenses/{expenseId} {
        allow read: if isSignedIn() && isValidId(expenseId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(expenseId);
      }
      match /customers/{customerId} {
        allow read: if isSignedIn() && isValidId(customerId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(customerId);
      }
      match /suppliers/{supplierId} {
        allow read: if isSignedIn() && isValidId(supplierId);
        allow write: if isSignedIn() && isEmailVerified() && isValidId(supplierId);
      }
    }
  }
}
```

---

## 10. DEPLOYMENT & CI/CD PIPELINE ARCHITECTURE

WAY TECH runs on a continuous-integration and deployment model managed by Git trunk-based branch policies.

### 10.1 Multi-Stage Environments
1. **Development (Local & Dev Server)**: Hot updates active, mock Firestore database, non-production sandbox environment.
2. **Staging**: Exact copy of production data structures under separate GCP sandbox project. Active on commit to the `main` branch.
3. **Production**: Continuous deployment activated via Git releases on tags matching `v*.*.*`. Immutable containers are built by Google Cloud Build and rolled out across GKE or Cloud Run using canary releases (10% increments over 30 minutes).

### 10.2 CI/CD Deployment Flow Chart
```
Developer Commit to 'main'
            │
            ▼
GitHub Actions (Linter + TypeScript Check + Unit Tests)
            │
            ▼
Google Cloud Build (Build Docker Image -> Google Artifact Registry)
            │
            ▼
Vulnerability Scan (Automated Container Image Verification)
            │
            ▼
Firestore Security Rules Lint & Deploy via CLI
            │
            ▼
Cloud Run Blue-Green / Canary Deploy (Port 3000 Ingress Routing)
```

---

## 11. STRATEGIC STANDARDS & CODING COMPASS

To guarantee high standards of execution, developers must strictly adhere to the following rules:

### 11.1 Naming and Code Standards
- **Component File Structure**: PascalCase for custom UI components (e.g., `StatsCard.jsx`), camelCase for hooks (e.g., `useBusiness.js`).
- **Standardized Type System**: Every Firestore document returned has a matching TypeScript interface defined in `/src/types.ts`.
- **Commit Convention**: Semantics matching Angular standard:
  - `feat(pos): add cash register balancing form`
  - `fix(auth): correct tenant id extraction on empty query`
  - `docs(arch): update database ERD specs`

### 11.2 Pull Request Checklist
1. All changes must compile without errors using `npm run build`.
2. Clean linting passes with zero errors from the linter.
3. PRs must contain updated security rules if any new collections are introduced.
4. Absolute rule: No user-authored features may bypass multi-tenant isolation layers.

---

## 12. ARCHITECTURAL TEXT DIAGRAMS

### 12.1 Detailed Relational Entity ERD
```
+------------------+         +------------------+         +------------------+
|     tenants      |         |     branches     |         |      users       |
+------------------+         +------------------+         +------------------+
| id (PK)   UUID   |         | id (PK)   UUID   |         | id (PK)   VARCHAR|
| company_name VAR |<--------| tenant_id (FK)   |<--------| tenant_id (FK)   |
| plan_tier   VAR  | 1    *  | name      VAR    | 1    *  | branch_id (FK)   |
+------------------+         +------------------+         | email     VAR    |
                                                          | role_id   VAR    |
                                                          +------------------+
                                                                   | 1
                                                                   |
                                                                   | *
                                                          +------------------+
                                                          |      orders      |
                                                          +------------------+
                                                          | id (PK)   UUID   |
                                                          | tenant_id (FK)   |
                                                          | user_id (FK)     |
                                                          | customer_id (FK) |
                                                          | total_amount NUM |
                                                          +------------------+
                                                                   | 1
                                                                   |
                                                                   | *
+------------------+         +------------------+         +------------------+
|     products     |         |     inventory    |         |   order_items    |
+------------------+         +------------------+         +------------------+
| id (PK)   UUID   |<--------| product_id (FK)  |         | id (PK)   UUID   |
| tenant_id (FK)   | 1    *  | branch_id (FK)   |         | order_id (FK) <--+
| sku       VAR    |         | quantity  NUM    |         | product_id (FK)  |
| price     NUM    |         +------------------+         | quantity  INT    |
| cost      NUM    |                                      | unit_price NUM   |
+------------------+                                      +------------------+
```

---
**Document Signed off by the Solution Architect Board. Standard active for developers starting development phases.**
