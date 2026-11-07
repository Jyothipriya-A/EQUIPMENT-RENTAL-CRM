# Equipment & Tool Rental CRM and Fleet Inventory Management System

An enterprise-grade, full-stack commercial **Equipment & Tool Rental Customer Relationship Management (CRM) and Fleet Inventory Management System**. The application is engineered to streamline heavy machinery dealerships, plant hire depots, construction equipment suppliers, and tool rental enterprises. 

The system features real-time overlap-aware availability scheduling to prevent double-booking collisions, multi-tier rate calculations, serialized fleet unit tracking, partial/full dispatch check-lists, a 3-stage return inspection and defect quarantine workflow, GST tax invoicing, double-entry financial ledger accounting, and responsive desktop and mobile portals.

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Commercial Rental Workflow](#-commercial-rental-workflow)
3. [Key Features & Functionality](#-key-features--functionality)
4. [Technology Stack](#-technology-stack)
5. [System Architecture & Folder Structure](#-system-architecture--folder-structure)
   - [Backend Structure](#backend-folder-structure)
   - [Frontend Structure](#frontend-folder-structure)
6. [Environment Variables Configuration](#-environment-variables-configuration)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [Database Setup & Migrations](#-database-setup--migrations)
9. [Running the Application Locally](#-running-the-application-locally)
10. [REST API Documentation & Endpoints](#-rest-api-documentation--endpoints)
11. [Automated Verification & Testing](#-automated-verification--testing)

---

## 📌 Project Overview

Operating equipment and tool rental operations requires stringent asset control, accurate availability tracking across overlapping calendar dates, and rigorous financial reconciliation. 

This platform eliminates manual logbooks and spreadsheet errors by implementing:
- **Real-Time Overlap Detection**: Mathematical validation against reserved and active bookings before locking assets.
- **Strict Asset Quarantine**: Returned units undergo mandatory condition checks before returning to the bookable inventory pool.
- **Dual Customer Handling**: Supports both individual retail clients (with government photo IDs) and corporate enterprises (with GSTIN, company contact persons, and Purchase Orders).
- **Automated Defect Routing**: Flagged damages during check-in automatically spawn workshop maintenance tickets and record financial deductions against customer security deposits.
- **Double-Entry Financial Accounting**: Automated debit and credit ledger tracking for rental revenue, deposit liabilities, late fees, and damage recoveries.

---

## 🔄 Commercial Rental Workflow

The platform enforces a closed-loop commercial equipment rental lifecycle:

```
[Customer Inquiries / Tool Demand]
                 │
                 ▼
 1. Check Real-Time Availability (Date Range & Unit Availability)
                 │
                 ├──▶ Mode A: Formal Price Quotation (QT-XXXX)
                 │         │
                 │         ▼
                 │    Client Approval ──▶ [1-Click Convert to Confirmed Booking]
                 │                                │
                 └──▶ Mode B: Direct Booking (RNT-XXXX)
                                                  │
                                                  ▼
                                 2. Auto-Issue GST Tax Invoice (INV-XXXX)
                                 3. Concurrency Lock: Asset Set to 'Reserved'
                                                  │
                                                  ▼
                                 4. Dispatch Handover (Full or Partial)
                                    - Delivery location & accessories checklist
                                    - Customer signature capture
                                    - Physical units set to 'Rented'
                                                  │
                                                  ▼
                                 5. Active Rental Tracking & Date Extension
                                    - Conflict checking for extended periods
                                    - Automated charge recalculation
                                                  │
                                                  ▼
                                 6. Return Stage 1: Check-in Quarantine
                                    - Assets set to 'Return Pending Inspection'
                                    - Quarantined: Blocked from re-hire
                                                  │
                                                  ▼
                                 7. Return Stage 2: Detailed Condition Inspection
                                    - 'Good Condition'      ──▶ Asset restored to 'Available'
                                    - 'Minor/Major Damage'  ──▶ Asset routed to 'Under Maintenance'
                                                                & Auto-generates Maintenance Ticket
                                    - Overdue late fee computation
                                    - Damage deduction assessment
                                                  │
                                                  ▼
                                 8. Return Stage 3: Final Settlement & Refund
                                    - Gross contract accounting
                                    - Security deposit deductions absorbed
                                    - Payout of net refundable balance
                                    - Ledger entry recorded & Rental marked 'Completed'
```

---

## ✨ Key Features & Functionality

### 1. Multi-Role Authentication & Access Control (RBAC)
- **Role Hierarchy**: Structured access partitioned into `admin`, `front_desk`, and `operations`.
- **JWT Authentication**: SimpleJWT implementation with automatic background access token refreshing via Axios interceptors.
- **Route Guards**: Protected React router wrappers restricting administrative settings, staff management, and system reports to authorized roles.

### 2. Fleet & Master Inventory Management
- **Hierarchical Catalog**: Equipment grouped by categories (e.g., Earthmoving, Concrete & Compaction, Power Generators) with Lucide icon associations.
- **Product Specifications**: Tracks product codes, SKU, replacement values, daily/weekly/monthly rental tiers, standard security deposits, and per-day late fees.
- **Serialized Asset Tracking**: Every physical fleet item is tracked independently via a unique **Serial Number** and **Asset ID**, monitoring purchase cost, supplier origin, current condition, and location.
- **Asset Statuses**: Real-time lifecycle states: `Available`, `Reserved`, `Rented`, `Return Pending Inspection`, `Under Maintenance`, `Damaged`, and `Retired`.

### 3. Real-Time Overlap-Aware Availability Engine
- Calculates availability for any specified start and end date range.
- Queries active reservations and rentals (`Reserved`, `Confirmed`, `Ready for Dispatch`, `Dispatched`, `Active`, `Partially Returned`, `Overdue`).
- Prevents double-booking collisions by verifying serial availability before booking confirmation.

### 4. 8-Step Interactive Rental Booking Wizard
- **Step 1: Customer Selection**: Quick search and selection of individual or business customers.
- **Step 2: Asset Assignment**: Filter and multi-select physical equipment units by category and availability.
- **Step 3: Rental Duration**: Select start date, expected return date, and automated duration computation.
- **Step 4: Logistics & Price Breakdown**: Calculation of daily/weekly/monthly rates, delivery fees, and security deposit totals.
- **Step 5: Discounts & PO Tracking**: Application of promotional discounts and customer PO numbers.
- **Step 6: Payment / Quotation Validity**: Direct booking advance collection or quote validity expiration setting.
- **Step 7: Review & Issue**: Comprehensive order summary before final database commit.
- **Step 8: Output Delivery**: Instant display and printing of rental agreements or quotation summaries.

### 5. Equipment Handover & Partial Dispatch
- Full or partial dispatch workflows allowing partial equipment release against large multi-unit contracts.
- Capture delivery locations (yard pickup vs site delivery), included accessories checklist (cables, blades, safety guards), and recipient signature names.

### 6. Three-Stage Return, Quarantine & Settlement Workflow
- **Quarantine Safeguard**: Prevents equipment from being re-rented immediately upon receipt.
- **Condition Grading**: Inspection findings (`Good Condition`, `Minor Damage`, `Major Damage`, `Missing Parts`, `Not Working`).
- **Defect Routing**: Automatically changes damaged assets to `Under Maintenance` and opens a workshop maintenance record.
- **Financial Settlement**: Gross contract balance computation, late fee absorption, damage deductions, and net security deposit disbursement.

### 7. Maintenance & Workshop Lifecycle
- Tracks routine inspections, repairs, parts replacements, and calibrations.
- Auto-locks assets from booking while maintenance is active, and automatically releases them back to `Available` upon ticket completion.

### 8. Billing, GST Invoices & Double-Entry Ledger
- **GST Invoices**: Auto-generates GST tax invoices (`INV-YYYY-XXXX`) calculating subtotal, CGST, SGST, and balance due.
- **Payment Recording**: Multi-channel payment tracking (`Cash`, `UPI`, `Card`, `Bank Transfer`) for advance payments, settlement payouts, and deposit refunds.
- **Financial Ledger**: Formal double-entry bookkeeping with debit and credit categorization (`Rental Revenue`, `Security Deposit Liability`, `Deposit Refund`, `Late Fee Revenue`, `Damage Fee Recovery`, `Maintenance Expense`).

### 9. Executive Analytics & Reporting
- Executive KPI cards: Fleet utilization %, active rentals, overdue returns, monthly revenue, pending receivables, and held deposits.
- 14-day daily revenue and booking volume trend charts.
- Overdue return notification alerts with direct customer contact links.
- Single-click CSV export engine for rentals, payments, inventory assets, and customer directories.

### 10. Printable Documents & Dedicated Mobile UI
- **Official PDF Rental Agreements**: Built using ReportLab with company terms, asset breakdowns, and liability clauses.
- **Dedicated Mobile Admin Interface**: Responsive view accessible at `/admin/mobile` featuring app-like navigation, touch targets, and drawer menus for yard supervisors.

---

## 🛠 Technology Stack

### Backend
- **Framework**: Python 3.12, Django 6.1 / 5.x
- **API Engine**: Django REST Framework (DRF)
- **Authentication**: `djangorestframework-simplejwt`
- **PDF Generation**: ReportLab
- **CORS Handling**: `django-cors-headers`
- **Configuration**: `python-dotenv`
- **Database Adapters**: `psycopg2-binary` (PostgreSQL), SQLite engine (development)

### Frontend
- **Runtime & Core**: React 19, JavaScript (ES6+ / JSX)
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT request/response interceptors

### Database
- **Development**: SQLite (`db.sqlite3` with `USE_SQLITE=True`)
- **Production Ready**: PostgreSQL via configuration in `.env`

---

## 🏛 System Architecture & Folder Structure

```text
Rental CRM/
├── backend/                              # Django REST Framework application
├── frontend/                             # React (Vite + Tailwind CSS) application
├── venv/                                 # Python virtual environment
├── README.md                             # System documentation
└── .gitignore                            # Version control exclusion rules
```

### Backend Folder Structure

```text
backend/
├── apps/                                 # Domain-driven modular applications
│   ├── authentication/                   # User model, StaffProfile, JWT auth, permissions
│   │   ├── models.py                     # Custom User (roles: admin, front_desk, operations)
│   │   ├── permissions.py                # Role-based DRF permission classes
│   │   ├── serializers.py                # User and Staff serializers
│   │   ├── views.py                      # Login, current user, staff management & settings
│   │   ├── urls.py                       # /api/auth/ endpoints
│   │   └── settings_urls.py              # System settings routes
│   ├── billing/                          # Financial management & accounting
│   │   ├── models.py                     # Payment, Invoice, LedgerEntry, SecurityDeposit
│   │   ├── serializers.py                # Financial serializers
│   │   ├── views.py                      # Invoices, Payments, Receipts, Ledger endpoints
│   │   └── urls.py                       # /api/payments/, /api/ledger/, /api/invoices/
│   ├── customers/                        # Client relationship management
│   │   ├── models.py                     # Customer (Individual vs Company), CompanyContact
│   │   ├── serializers.py                # Customer profile serializers
│   │   ├── views.py                      # Customer CRUD & rental history
│   │   └── urls.py                       # /api/customers/ endpoints
│   ├── inventory/                        # Equipment and fleet management
│   │   ├── management/commands/
│   │   │   └── seed_data.py              # Realistic sample data seeder
│   │   ├── models.py                     # Category, Supplier, Product, Asset (serialized units)
│   │   ├── serializers.py                # Equipment & asset serializers
│   │   ├── views.py                      # Fleet catalog and status management
│   │   └── urls.py                       # /api/products/, /api/assets/, /api/categories/
│   ├── maintenance/                      # Workshop and servicing management
│   │   ├── models.py                     # MaintenanceRecord (auto asset lock/release)
│   │   ├── serializers.py                # Maintenance serializers
│   │   ├── views.py                      # Maintenance scheduling and completion
│   │   └── urls.py                       # /api/maintenance/ endpoints
│   ├── notifications/                    # Notification alerts
│   │   ├── models.py                     # Notification model
│   │   ├── serializers.py                # Notification serializers
│   │   ├── views.py                      # Unread counts, mark read
│   │   └── urls.py                       # /api/notifications/ endpoints
│   ├── rentals/                          # Rental core business engine
│   │   ├── models.py                     # Rental, RentalItem, Dispatch, Return, Damage, Settlement
│   │   ├── serializers.py                # Rental contract and inspection serializers
│   │   ├── views.py                      # Availability engine, booking wizard, dispatch/return/settle
│   │   └── urls.py                       # /api/rentals/ endpoints
│   └── reports/                          # Business intelligence & CSV exports
│       ├── views.py                      # DashboardStatsView, RevenueReportView, ExportCSVView
│       └── urls.py                       # /api/reports/ endpoints
├── rental_crm/                           # Project configuration
│   ├── settings.py                       # Django global settings (JWT, CORS, DB, Apps)
│   ├── urls.py                           # Root URL configuration
│   ├── wsgi.py                           # WSGI entrypoint
│   └── asgi.py                           # ASGI entrypoint
├── db.sqlite3                            # Default development database
├── manage.py                             # Django CLI tool
├── requirements.txt                      # Python dependencies manifest
├── system_settings.json                  # Business settings storage
├── test_crm_scenarios.py                 # Automated 16-phase commercial workflow verification
├── .env.example                          # Backend environment template
└── .env                                  # Active backend environment variables (git-ignored)
```

### Frontend Folder Structure

```text
frontend/
├── public/                               # Static web assets
│   ├── favicon.svg                       # Browser tab icon
│   └── icons.svg                         # SVG symbol definitions
├── src/
│   ├── api/                              # HTTP client layer
│   │   ├── client.js                     # Axios instance with JWT interceptors
│   │   └── index.js                      # Modular API service methods
│   ├── components/                       # Shared UI components & modals
│   │   ├── AgreementModal.jsx            # Printable rental agreement modal
│   │   ├── Badge.jsx                     # Status badge styling
│   │   ├── DamageInspectionModal.jsx     # Return condition & damage inspection modal
│   │   ├── InvoiceModal.jsx              # Official GST invoice preview & print
│   │   ├── Modal.jsx                     # Base dialog modal
│   │   ├── Navbar.jsx                    # Top navigation with user status & notifications
│   │   ├── ProtectedRoute.jsx            # Role-based route authorization guard
│   │   ├── ReceiptModal.jsx              # Official payment receipt modal
│   │   ├── Sidebar.jsx                   # Desktop navigation sidebar
│   │   └── StatCard.jsx                  # Metric KPI card
│   ├── context/                          # State management providers
│   │   ├── AuthContext.jsx               # User session, JWT lifecycle & role state
│   │   └── NotificationContext.jsx       # Alert toaster & notification polling
│   ├── layouts/                          # Screen layout wrappers
│   │   ├── AdminLayout.jsx               # Desktop admin portal layout
│   │   ├── MobileAdminLayout.jsx         # Mobile-optimized administrative layout
│   │   └── OperationsLayout.jsx          # Front-desk operations layout
│   ├── pages/                            # Application view pages
│   │   ├── admin/                        # Admin Portal Views
│   │   │   ├── AdminDashboard.jsx        # Analytics, charts, and overdue alerts
│   │   │   ├── Assets.jsx                # Serialized asset tracking & status management
│   │   │   ├── Customers.jsx             # Corporate & individual customer directory
│   │   │   ├── Maintenance.jsx           # Workshop tickets & repair management
│   │   │   ├── NotificationsPage.jsx     # Notification center
│   │   │   ├── PaymentsLedger.jsx        # Payment transactions & double-entry ledger
│   │   │   ├── Products.jsx              # Product catalog, rental rates & deposits
│   │   │   ├── Rentals.jsx               # Rental contracts list & lifecycle filters
│   │   │   ├── Reports.jsx               # Financial reports & CSV exports
│   │   │   ├── ReturnsInspection.jsx     # Returns quarantine & inspection management
│   │   │   ├── SettingsPage.jsx          # Company & operational parameters
│   │   │   ├── StaffManagement.jsx       # Staff directory & role configuration
│   │   │   └── Suppliers.jsx             # Fleet equipment suppliers
│   │   ├── auth/                         # Authentication Views
│   │   │   └── Login.jsx                 # Login portal for Admin & Operations staff
│   │   └── operations/                   # Front Desk Counter Views
│   │       ├── BillingPage.jsx           # Counter payments & settlement reconciliation
│   │       ├── CreateRentalBooking.jsx   # 8-step booking & quotation wizard
│   │       ├── CustomerRegistration.jsx  # Rapid counter customer onboarding
│   │       ├── DispatchPage.jsx          # Handover checklists & dispatch release
│   │       ├── OperationsDashboard.jsx   # Real-time counter operations cockpit
│   │       ├── RealTimeAvailability.jsx  # Date-range availability calculator
│   │       └── ReturnsPage.jsx           # Return check-in & quarantine intake
│   ├── App.jsx                           # Route declarations & role mappings
│   ├── main.jsx                          # React DOM application mount
│   └── index.css                         # Tailwind CSS directives
├── package.json                          # Frontend dependencies & build scripts
├── vite.config.js                        # Vite bundler configuration
├── .env.example                          # Frontend environment template
└── .env                                  # Active frontend environment variables (git-ignored)
```

---

## ⚙️ Environment Variables Configuration

The project utilizes environment files for backend and frontend settings. Sample configuration files (`.env.example`) are provided in both directories.

### 1. Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cd backend
cp .env.example .env
```

| Variable | Description | Default / Example Value |
|---|---|---|
| `SECRET_KEY` | Django cryptographic signing secret | *Use a secure random string in production* |
| `DEBUG` | Enable/disable debug mode | `True` for development, `False` for production |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1,0.0.0.0` |
| `USE_SQLITE` | Switch between SQLite and PostgreSQL | `True` (SQLite) / `False` (PostgreSQL) |
| `DB_ENGINE` | Database backend engine (if `USE_SQLITE=False`) | `django.db.backends.postgresql` |
| `DB_NAME` | PostgreSQL database name | `rental_crm_db` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token lifespan in minutes | `120` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh token lifespan in days | `7` |
| `CORS_ALLOWED_ORIGINS` | Permitted cross-origin origins | `http://localhost:5173,http://127.0.0.1:5173` |

### 2. Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cd frontend
cp .env.example .env
```

| Variable | Description | Default Value |
|---|---|---|
| `VITE_API_BASE_URL` | Root URL for backend REST API requests | `http://localhost:8000/api` |

---

## 📦 Installation & Setup Guide

### Prerequisites
- **Python**: Version 3.10, 3.11, or 3.12 installed
- **Node.js**: Version 18.x, 20.x, or newer with `npm`
- **Git**: Version control tool

---

### Step 1: Clone or Open the Repository

```bash
cd "c:\Users\hp\Desktop\Rental CRM"
```

### Step 2: Backend Setup

1. **Create and Activate a Python Virtual Environment**:
   - On Windows:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure Environment File**:
   Ensure `backend/.env` is created from `backend/.env.example` (configured with `USE_SQLITE=True` by default for instant local setup).

---

### Step 3: Frontend Setup

1. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

2. **Configure Environment File**:
   Ensure `frontend/.env` is created from `frontend/.env.example`.

---

## 🗄️ Database Setup & Migrations

All database schema migrations are pre-packaged within each Django app.

1. **Apply Schema Migrations**:
   Run from the `backend/` directory with your virtual environment active:
   ```bash
   python manage.py migrate
   ```

2. **Create an Initial Administrator Account (Optional)**:
   ```bash
   python manage.py createsuperuser
   ```

3. **Seed Demonstration Data (Recommended)**:
   The system includes a data seeder command that populates categories, suppliers, equipment products, serialized assets, customer profiles, booking contracts, dispatches, returns, invoices, and ledger records:
   ```bash
   python manage.py seed_data
   ```

---

## 🚀 Running the Application Locally

To run the complete system, start the backend Django REST API server and the Vite React development server in separate terminal windows.

### 1. Start the Backend API Server

```bash
cd backend
# With virtual environment active:
python manage.py runserver 127.0.0.1:8000
```
- API Base URL: `http://127.0.0.1:8000/api/`
- Django Administration: `http://127.0.0.1:8000/admin/`

### 2. Start the Frontend Development Server

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Frontend Web App: `http://127.0.0.1:5173/`

### 3. Application Portals

Once both servers are running, access the application through your web browser:

| Portal | URL Path | Intended Roles |
|---|---|---|
| **Login Screen** | `http://127.0.0.1:5173/login` | All users |
| **Desktop Admin Portal** | `http://127.0.0.1:5173/admin/dashboard` | `admin` |
| **Mobile Admin UI** | `http://127.0.0.1:5173/admin/mobile` | `admin` |
| **Operations Counter Portal** | `http://127.0.0.1:5173/operations/dashboard` | `front_desk`, `operations`, `admin` |

---

## 📡 REST API Documentation & Endpoints

All API endpoints reside under `/api/` and require JWT Bearer token authentication in the HTTP header (except `/api/auth/login/` and `/api/auth/refresh/`):
```http
Authorization: Bearer <access_token>
```

### 1. Authentication & Staff Management (`/api/auth/`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login/` | Authenticate with email/password and obtain JWT token pair |
| `POST` | `/api/auth/refresh/` | Refresh expired access token using refresh token |
| `GET` | `/api/auth/me/` | Retrieve authenticated user profile and permissions |
| `GET` / `POST` | `/api/auth/staff/` | List all staff members or register a new staff user (Admin only) |
| `GET` / `PUT` / `DELETE` | `/api/auth/staff/{id}/` | Retrieve, update, or remove staff profile |

### 2. Master Equipment & Fleet Inventory (`/api/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/categories/` | List and create equipment categories |
| `GET` / `PUT` / `DELETE` | `/api/categories/{id}/` | Category detail, update, and deletion |
| `GET` / `POST` | `/api/suppliers/` | Manage fleet equipment suppliers |
| `GET` / `POST` | `/api/products/` | Equipment product catalog with rate tiers & replacement values |
| `GET` / `PUT` / `DELETE` | `/api/products/{id}/` | Product details and rate tier modifications |
| `GET` / `POST` | `/api/assets/` | List and create physical units with serial numbers |
| `GET` / `PUT` / `DELETE` | `/api/assets/{id}/` | Update asset condition, location, or availability status |

### 3. Customer Management (`/api/customers/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/customers/` | List and create customers (Individual vs Company with GSTIN) |
| `GET` / `PUT` / `DELETE` | `/api/customers/{id}/` | Retrieve customer profile, credit terms, and contacts |

### 4. Rentals, Booking Engine & Operations (`/api/rentals/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rentals/availability/` | Check real-time serialized asset availability for date ranges |
| `GET` / `POST` | `/api/rentals/` | List existing rentals and draft bookings |
| `POST` | `/api/rentals/create_quotation/` | Generate formal commercial price quotation (`QT-XXXX`) |
| `POST` | `/api/rentals/{id}/convert_quotation/` | Convert quotation to confirmed booking with asset locks |
| `POST` | `/api/rentals/create_booking/` | Direct booking creation with real-time collision check |
| `POST` | `/api/rentals/{id}/dispatch/` | Execute full or partial dispatch with handover details |
| `POST` | `/api/rentals/{id}/process_return/` | Check-in equipment into Stage 1 Quarantine (`Return Pending Inspection`) |
| `POST` | `/api/rentals/{id}/inspect/` | Stage 2 Condition inspection; auto-routes damage to maintenance |
| `POST` | `/api/rentals/{id}/settle/` | Stage 3 Final settlement; balance reconciliation and deposit refund |
| `POST` | `/api/rentals/{id}/extend/` | Extend active rental duration with conflict verification |
| `POST` | `/api/rentals/{id}/cancel/` | Cancel booking and release reserved units |
| `GET` | `/api/rentals/{id}/agreement/` | Structured agreement data payload |
| `GET` | `/api/rentals/{id}/agreement_pdf/` | Download printable PDF rental agreement generated via ReportLab |

### 5. Billing, Invoicing & Financial Ledger (`/api/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/invoices/` | List and generate official GST tax invoices (`INV-YYYY-XXXX`) |
| `GET` / `POST` | `/api/payments/` | List and record payments (advance, settlement, refunds) |
| `GET` | `/api/payments/{id}/receipt/` | Fetch official payment receipt details |
| `GET` | `/api/deposits/` | View security deposit liabilities and refund statuses |
| `GET` | `/api/ledger/` | View double-entry financial ledger entries |
| `GET` | `/api/ledger/summary/` | Retrieve aggregate debit/credit financial summaries |

### 6. Maintenance & Servicing (`/api/maintenance/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/maintenance/` | List active maintenance tickets or log a repair request |
| `POST` | `/api/maintenance/{id}/complete/` | Complete maintenance ticket and restore asset to `Available` |

### 7. Executive Reports & System Configuration
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/dashboard-stats/` | Real-time statistics, fleet utilization %, and overdue alerts |
| `GET` | `/api/reports/revenue/` | Revenue summaries grouped by payment method and type |
| `GET` | `/api/reports/export-csv/?type=<rentals\|revenue\|assets\|customers>` | Download detailed CSV reports |
| `GET` / `PUT` | `/api/settings/` | Retrieve and update business parameters (`system_settings.json`) |
| `GET` | `/api/notifications/` | Retrieve notification feed |
| `POST` | `/api/notifications/mark_all_read/` | Mark all unread notifications as read |

---

## 🧪 Automated Verification & Testing

The repository contains an automated end-to-end commercial scenario verification test suite located at `backend/test_crm_scenarios.py`.

The suite validates the complete 16-phase commercial workflow:
1. Admin & Staff Authentication & RBAC restriction verification
2. Dual customer profile registration (Individual vs Corporate with GSTIN)
3. Equipment product catalog and serialized fleet assets
4. Real-time overlap-aware availability calculation
5. Commercial quotation creation (`QT-XXXX`)
6. Quotation-to-booking conversion with concurrency locks and auto-invoicing
7. Strict double-booking collision prevention
8. Partial equipment dispatch release
9. Full dispatch and asset state transition to `Rented`
10. Active rental extension with conflict checking
11. Return Stage 1: Check-in quarantine (`Return Pending Inspection`)
12. Return Stage 2: Condition inspection and automated defect routing
13. Return Stage 3: Final settlement and deposit refund disbursement
14. GST Tax Invoicing and balance calculations
15. Fleet maintenance lifecycle and automatic asset restoration
16. Real-time executive analytics and financial ledger balance verification

### Running the Test Suite:

```bash
cd backend
python test_crm_scenarios.py
```

Expected output:
```text
===========================================================================
STARTING TEST SUITE: END-TO-END EQUIPMENT & TOOL RENTAL CRM WORKFLOW
===========================================================================
[PHASE 1] Testing Admin & Staff Authentication & RBAC... [OK]
[PHASE 2] Registering Dual Customer Profiles (Individual vs Company)... [OK]
[PHASE 3] Creating Equipment Products & Individual Physical Fleet Units... [OK]
[PHASE 4] Checking Real-Time Overlap-Aware Availability... [OK]
[PHASE 5] Creating Formal Commercial Quotation (QT-XXXX)... [OK]
[PHASE 6] Converting Quotation to Confirmed Booking with Concurrency Lock... [OK]
[PHASE 7] Testing Double-Booking Collision Prevention... [OK]
[PHASE 8] Executing Partial Dispatch (1 of 2 Units Released)... [OK]
[PHASE 9] Executing Full Dispatch for Remaining Fleet Unit... [OK]
[PHASE 10] Testing Active Rental Extension... [OK]
[PHASE 11] Return Stage 1: Processing Equipment Return Check-in... [OK]
[PHASE 12] Return Stage 2: Detailed Condition Inspection & Defect Routing... [OK]
[PHASE 13] Return Stage 3: Final Settlement & Security Deposit Payout... [OK]
[PHASE 14] Verifying Invoices, Financial Ledger & Double-Entry Accounting... [OK]
[PHASE 15] Verifying Real-Time Admin Analytics & Fleet Utilization... [OK]
===========================================================================
ALL 16 REAL-WORLD CRM COMMERCIAL WORKFLOW SCENARIOS PASSED WITH 100% SUCCESS!
===========================================================================
```

---

## 📄 License & Intellectual Property

This project is proprietary software developed for commercial equipment rental operations and fleet inventory management. All rights reserved.
