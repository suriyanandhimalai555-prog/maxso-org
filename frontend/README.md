# Maxso — Developer Documentation

> Full-stack investment platform with referral networking, plan management, and admin dashboard.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running the App](#running-the-app)
7. [Building for Production](#building-for-production)
8. [Architecture Overview](#architecture-overview)
9. [How to Add a New Feature](#how-to-add-a-new-feature)
10. [Reusable Components Reference](#reusable-components-reference)
11. [API Service & Hook Reference](#api-service--hook-reference)
12. [Style System](#style-system)
13. [Authentication & Authorization](#authentication--authorization)
14. [Existing API Endpoints](#existing-api-endpoints)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 7, TailwindCSS 3, Redux Toolkit, React Router 6 |
| **Backend** | Node.js, Express 4, PostgreSQL (pg driver) |
| **Auth** | JWT (HttpOnly cookies), bcrypt |
| **Tooling** | Nodemon (backend hot-reload), ESLint |

---

## Project Structure

```
Frontend/
├── backend/                    ← Express API server
│   ├── controllers/            ← Business logic
│   │   ├── userController.js       — Auth, profile, referrals
│   │   ├── planController.js       — CRUD for investment plans
│   │   ├── levelConfigController.js — Level config CRUD
│   │   ├── transactionController.js — Deposit/withdraw/transfer
│   │   └── dashboardController.js   — Dashboard statistics
│   ├── routes/                 ← Express route definitions
│   │   ├── user.js, plan.js, levelConfig.js, transaction.js, dashboard.js
│   ├── middleware/
│   │   ├── requireAuth.js          — JWT verification + role check
│   │   └── errorMiddleware.js      — Global error handler
│   ├── scripts/                ← Database migration scripts
│   ├── db.js                   ← PostgreSQL connection pool
│   ├── server.js               ← Express app entry point
│   └── .env                    ← Backend env vars
│
├── src/                        ← React frontend
│   ├── components/
│   │   ├── common/             ← Reusable UI components
│   │   │   ├── Modal.jsx           — Configurable modal dialog
│   │   │   ├── PageHeader.jsx      — Page title + badge + actions
│   │   │   ├── FormField.jsx       — Label + input/select/textarea
│   │   │   ├── StatusBadge.jsx     — Colored status pills
│   │   │   └── SuccessMessage.jsx  — Toast notifications
│   │   └── layout/
│   │       ├── Navbar.jsx          — Top navigation bar
│   │       └── Sidebar.jsx         — Side navigation with dropdowns
│   ├── pages/                  ← Page-level components
│   │   ├── Home.jsx                — Dashboard
│   │   ├── Login.jsx / Signup.jsx  — Authentication
│   │   ├── Plans.jsx               — Investment plans (admin CRUD + user buy)
│   │   ├── Portfolio.jsx           — User's active plans
│   │   ├── Transactions.jsx        — Deposit/Withdraw/Transfer tabs
│   │   ├── UserManagement.jsx      — Admin user management
│   │   ├── LevelConfig.jsx         — Admin level configuration
│   │   ├── Settings.jsx            — Profile + Support + Account
│   │   ├── MyNetwork.jsx           — Referral tree visualization
│   │   └── MyReferrals.jsx         — Paginated referral list
│   ├── hooks/
│   │   └── useApi.js           ← Custom data-fetching hook
│   ├── services/
│   │   └── api.js              ← Centralized API service
│   ├── styles/                 ← Organized style modules
│   │   ├── index.js                — Merges all modules (backward-compatible)
│   │   ├── layout.js               — Sidebar, Navbar, App wrapper
│   │   ├── common.js               — Buttons, forms, pagination
│   │   ├── dashboard.js            — Dashboard cards
│   │   ├── plans.js                — Plans + Portfolio
│   │   ├── users.js                — User Management
│   │   ├── transactions.js         — Transactions
│   │   ├── levelConfig.js          — Level Config
│   │   ├── settings.js             — Settings
│   │   └── networking.js           — My Network + My Referrals
│   ├── features/
│   │   └── authSlice.js        ← Redux auth state management
│   ├── store/
│   │   └── store.js            ← Redux store configuration
│   ├── config/
│   │   └── api.js              ← API_URL configuration
│   ├── App.jsx                 ← Root component + routes
│   └── main.jsx                ← React entry point
│
├── .env                        ← Frontend env vars
├── package.json                ← Frontend dependencies
├── vite.config.js              ← Vite configuration
├── tailwind.config.js          ← TailwindCSS configuration
└── index.html                  ← HTML entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (download from [nodejs.org](https://nodejs.org))
- **PostgreSQL** v14+ (download from [postgresql.org](https://www.postgresql.org/download/))
- **npm** (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Frontend

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..
```

---

## Environment Variables

### Frontend — `Frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

### Backend — `Frontend/backend/.env`

```env
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
SECRET=your_jwt_secret_key_here
```

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/maxso` |
| `SECRET` | JWT signing secret | Any long random string |

---

## Database Setup

Run the migration scripts in order to create the required tables:

```bash
cd backend

# Create tables (run each one)
node scripts/create_plan_table.js
node scripts/create_level_config_table.js
node scripts/create_transaction_tables.js
node scripts/create_user_plan_table.js
node scripts/add_profile_columns.js

# Verify the database
node scripts/check_db.js
```

### Database Tables

#### `User`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing ID |
| `email` | TEXT | User email (unique) |
| `password` | TEXT | Bcrypt hashed password |
| `name` | VARCHAR(100) | Display name |
| `referral_code` | TEXT | Unique referral code (e.g. `MAX7C84C3CB`) |
| `referred_by` | INTEGER | ID of the user who referred them |
| `referral_count` | INTEGER | Number of direct referrals |
| `wallet_balance` | DECIMAL(15,2) | Available wallet balance |
| `phone_number` | VARCHAR(20) | Phone number |
| `wallet_address` | VARCHAR(255) | Crypto wallet address |
| `country` | VARCHAR(100) | Country |
| `role` | VARCHAR(20) | `user` or `admin` |
| `status` | BOOLEAN | Active (`true`) / Inactive (`false`) |
| `created_at` | TIMESTAMP | Account creation date |

#### `Referral`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing ID |
| `referrer_code` | TEXT | Referral code of the person who referred |
| `referred_code` | TEXT | Referral code of the person who was referred |
| `level` | INTEGER | Referral depth level (1 = direct, 2 = indirect, etc.) |
| `created_at` | TIMESTAMP | When the referral was created |

> This table powers the **My Network** tree view and **My Referrals** list. When user B signs up using user A's referral code, a row is inserted with `referrer_code = A's code`, `referred_code = B's code`, `level = 1`. Multi-level entries (level 2, 3, etc.) are also created for upstream referrers.

#### `Plan`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing ID |
| `name` | VARCHAR(100) | Plan name (e.g. "Gold") |
| `roi` | DECIMAL(10,2) | Return on investment percentage |
| `duration` | INTEGER | Duration value |
| `duration_unit` | VARCHAR(20) | `days`, `months`, `years` |
| `referral_bonus` | DECIMAL(10,2) | Referral bonus percentage |
| `ceiling_limit` | VARCHAR(255) | Maximum earning limit |
| `min_deposit` | DECIMAL(15,2) | Minimum deposit amount |
| `max_deposit` | DECIMAL(15,2) | Maximum deposit amount |
| `status` | VARCHAR(20) | `active` or `inactive` |
| `created_at` | TIMESTAMP | Creation date |

#### `UserPlan`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing ID |
| `user_id` | INTEGER FK → User | User who purchased the plan |
| `plan_id` | INTEGER FK → Plan | The plan that was purchased |
| `amount` | DECIMAL(15,2) | Amount invested |
| `deposit_type` | VARCHAR(20) | Wallet used (`trust_wallet`, `roi_wallet`, `level_wallet`) |
| `status` | VARCHAR(20) | `active`, `completed`, `cancelled` |
| `start_date` | TIMESTAMP | When the plan started |
| `end_date` | TIMESTAMP | When the plan expires |
| `created_at` | TIMESTAMP | Purchase date |

#### `Transaction`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing ID |
| `user_id` | INTEGER FK → User | User who made the transaction |
| `type` | VARCHAR(20) | `deposit`, `withdraw`, or `transfer` |
| `amount` | DECIMAL(15,2) | Transaction amount |
| `status` | VARCHAR(20) | `completed`, `pending`, etc. |
| `reference_user_id` | INTEGER FK → User | For transfers: the other user |
| `created_at` | TIMESTAMP | Transaction date |

#### `LevelConfig`
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing ID |
| `level` | INTEGER (unique) | Referral level number (1, 2, 3...) |
| `percentage` | DECIMAL(5,2) | Commission percentage for this level |
| `required_volume` | DECIMAL(15,2) | Minimum volume required to qualify |
| `status` | VARCHAR(20) | `active` or `inactive` |
| `created_at` | TIMESTAMP | Creation date |


---

## Running the App

You need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

This starts the Express server on `http://localhost:4000` using nodemon (auto-restarts on file changes).

### Terminal 2 — Frontend

```bash
# In the root Frontend/ directory
npm run dev
```

This starts the Vite dev server on `http://localhost:5174` with hot module replacement (instant updates on save).

### Open in Browser

Go to **http://localhost:5174**

---

## Building for Production

### What is a "build"?

A build converts your React source code (JSX, CSS, assets) into optimized, minified static files (HTML, CSS, JS) that can be served by any web server (Nginx, Apache, Vercel, Netlify, etc.).

### How to Build

```bash
# In the root Frontend/ directory
npm run build
```

This creates a `dist/` folder containing the production-ready files:

```
dist/
├── index.html          ← Entry HTML file
├── assets/
│   ├── index-xxxx.js   ← Minified JavaScript bundle
│   └── index-xxxx.css  ← Minified CSS bundle
```

### Preview the Build Locally

```bash
npm run preview
```

This starts a local server at `http://localhost:4173` serving the built files.

### Deploy

Upload the contents of the `dist/` folder to your hosting provider. The backend needs to be deployed separately (e.g., on a VPS, Heroku, Railway, etc.).

**Important:** Update `VITE_API_URL` in `.env` to your production backend URL before building.

---

## Architecture Overview

### Frontend Data Flow

```
User Action → Page Component → api.js service → Backend API
                   ↓
              Redux Store (auth state)
                   ↓
           Re-render with new data
```

### Request Lifecycle

1. User interacts with UI (e.g., clicks "Buy Plan")
2. Page component calls `api.post('/api/plans/buy', data)`
3. `api.js` sends fetch request with credentials (JWT cookie)
4. Backend validates JWT in `requireAuth` middleware
5. Controller processes request, queries PostgreSQL
6. Response flows back → component updates state → UI re-renders

### Authentication Flow

```
Signup/Login → Backend returns JWT in HttpOnly cookie
           → Frontend calls /api/user/me to verify
           → Redux stores user object
           → Routes render based on user.role
```

---

## How to Add a New Feature

This is a step-by-step guide using "Withdrawals History" as an example.

### Step 1 — Backend: Create the Controller

Create or edit a controller in `backend/controllers/`:

```javascript
// backend/controllers/withdrawalController.js
const db = require('../db');

const getWithdrawals = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM "Transaction" WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC',
            [req.user.id, 'withdraw']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getWithdrawals };
```

### Step 2 — Backend: Add the Route

Create or edit a route file in `backend/routes/`:

```javascript
// In backend/routes/user.js (or a new route file)
const { getWithdrawals } = require('../controllers/withdrawalController');
router.get('/withdrawals', requireAuth, getWithdrawals);
```

If it's a new route file, register it in `backend/server.js`:

```javascript
app.use('/api/withdrawals', require('./routes/withdrawal'));
```

### Step 3 — Frontend: Add Styles (if needed)

Create a new style file in `src/styles/`:

```javascript
// src/styles/withdrawals.js
const withdrawalsStyles = {
    // your styles here
};
export default withdrawalsStyles;
```

Add it to `src/styles/index.js`:

```javascript
import withdrawalsStyles from './withdrawals';

const styles = {
    ...layoutStyles,
    // ... existing imports
    ...withdrawalsStyles,  // ← add here
};
```

### Step 4 — Frontend: Create the Page Component

Create a new page in `src/pages/`:

```javascript
// src/pages/Withdrawals.jsx
import React from 'react';
import api from '../services/api';
import useApi from '../hooks/useApi';
import PageHeader from '../components/common/PageHeader';
import styles from '../styles';

const Withdrawals = () => {
    const { data, loading, error } = useApi('/api/user/withdrawals');

    return (
        <div>
            <PageHeader title="Withdrawals" badge={data?.length} />
            {loading && <p className={styles.umLoading}>Loading...</p>}
            {error && <p className={styles.umError}>{error}</p>}
            {/* render your table/cards here */}
        </div>
    );
};

export default Withdrawals;
```

### Step 5 — Frontend: Add the Route

In `src/App.jsx`:

```javascript
import Withdrawals from './pages/Withdrawals';

// Inside <Routes>:
<Route path="/withdrawals" element={<Withdrawals />} />
```

### Step 6 — Frontend: Add to Sidebar

In `src/components/Sidebar.jsx`, add a new link:

```javascript
<Link to="/withdrawals" className={currentPath === '/withdrawals' ? styles.sidebarLinkActive : styles.sidebarLink}>
    <svg className="w-5 h-5" ...>...</svg>
    Withdrawals
</Link>
```

### Step 7 — Restart & Test

- Restart the backend server if you changed backend files
- The frontend auto-refreshes via Vite HMR

---

## Reusable Components Reference

### `<Modal />`

```jsx
import Modal from '../components/common/Modal';

<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit Plan" size="md">
    <form>...</form>
</Modal>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | — | Show/hide the modal |
| `onClose` | function | — | Called when closing |
| `title` | string | — | Modal header title |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Width of the modal |
| `children` | ReactNode | — | Modal body content |

---

### `<PageHeader />`

```jsx
import PageHeader from '../components/common/PageHeader';

<PageHeader
    title="Plans"
    badge="12"
    actions={<button className={styles.planAddButton}>+ Add Plan</button>}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Page title |
| `badge` | string/number | Optional count badge |
| `actions` | ReactNode | Optional action buttons |

---

### `<FormField />`

```jsx
import FormField from '../components/common/FormField';

<FormField label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} />

<FormField label="Status" type="select" value={status} onChange={(e) => setStatus(e.target.value)}
    options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Field label |
| `type` | `'text' \| 'number' \| 'select' \| 'textarea' \| 'date'` | Input type |
| `value` | any | Current value |
| `onChange` | function | Change handler |
| `options` | `[{value, label}]` | For select type |
| `hint` | string | Helper text below input |
| `error` | string | Validation error text |

---

### `<StatusBadge />`

```jsx
import StatusBadge from '../components/common/StatusBadge';

<StatusBadge status="active" />
<StatusBadge status="pending" label="Awaiting Review" />
```

Built-in statuses: `active`, `inactive`, `pending`, `completed`, `cancelled`, `open`, `closed`, `high`, `medium`, `low`, `admin`, `user`

---

### `<SuccessMessage />`

```jsx
import SuccessMessage from '../components/common/SuccessMessage';

<SuccessMessage message="Plan created!" isVisible={showSuccess} />
```

---

## API Service & Hook Reference

### `api.js` — Direct API Calls

```javascript
import api from '../services/api';

// GET
const plans = await api.get('/api/plans');

// POST
const newPlan = await api.post('/api/plans', { name: 'Gold', roi: 10 });

// PUT
await api.put('/api/plans/5', { name: 'Gold V2' });

// DELETE
await api.del('/api/plans/5');

// PATCH
await api.patch('/api/user/profile', { name: 'John' });
```

All methods automatically:
- Include credentials (JWT cookie)
- Set `Content-Type: application/json`
- Parse JSON responses
- Throw errors with server message

---

### `useApi` — Hook for Data Fetching

```javascript
import useApi from '../hooks/useApi';

// Auto-fetch on mount
const { data, loading, error, refetch } = useApi('/api/plans');

// Manual fetch (don't auto-fetch)
const { data, loading, refetch } = useApi('/api/plans', { immediate: false });

// Refetch after an action
const handleDelete = async (id) => {
    await api.del(`/api/plans/${id}`);
    refetch(); // refresh the list
};
```

---

## Style System

### How it works

Styles are organized in `src/styles/` by domain. The `index.js` merges all into one object.

```javascript
// Option 1: Import the full styles object (backward-compatible)
import styles from '../styles';
<div className={styles.planCard}>...</div>

// Option 2: Import a specific domain module
import { plansStyles } from '../styles';
<div className={plansStyles.planCard}>...</div>

// Option 3: Import the networking styles (object-style, not Tailwind strings)
import { networkingStyles } from '../styles';
<div style={networkingStyles.treeNode}>...</div>
```

### Adding new styles

1. Find the appropriate domain file in `src/styles/` (or create a new one)
2. Add your style key-value pair
3. If you created a new file, import and spread it in `src/styles/index.js`

---

## Authentication & Authorization

| Middleware | Purpose |
|-----------|---------|
| `requireAuth` | Verifies JWT from HttpOnly cookie, attaches `req.user` |
| `requireAdmin` | Checks `req.user.role === 'admin'` |

### Protecting a route (backend)

```javascript
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');

router.get('/admin-only', requireAuth, requireAdmin, controller);
router.get('/user-data', requireAuth, controller);
```

### Checking role (frontend)

```javascript
const user = useSelector((state) => state.auth.user);

{user?.role === 'admin' && <AdminComponent />}
{user?.role !== 'admin' && <UserComponent />}
```

---

## Existing API Endpoints

### Auth & User (`/api/user`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | No | Register new user |
| POST | `/login` | No | Login, returns JWT cookie |
| POST | `/logout` | Yes | Clear JWT cookie |
| GET | `/me` | Yes | Get current user profile |
| PUT | `/profile` | Yes | Update profile info |
| PUT | `/password` | Yes | Change password |
| GET | `/my-referrals` | Yes | Paginated referral list |
| GET | `/my-network` | Yes | Referral tree data |
| GET | `/admin/users` | Admin | All users with pagination |
| PUT | `/admin/users/:id/toggle` | Admin | Toggle user active/inactive |
| DELETE | `/admin/users/:id` | Admin | Delete user |
| GET | `/admin/referral-history` | Admin | All referral history |

### Plans (`/api/plans`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List all plans |
| POST | `/` | Admin | Create plan |
| PUT | `/:id` | Admin | Update plan |
| DELETE | `/:id` | Admin | Delete plan |
| PATCH | `/:id/toggle` | Admin | Toggle plan active/inactive |
| POST | `/buy` | Yes | Purchase a plan |
| GET | `/my-plans` | Yes | User's purchased plans |

### Level Config (`/api/level-configs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List all levels |
| POST | `/` | Admin | Create level |
| PUT | `/:id` | Admin | Update level |
| DELETE | `/:id` | Admin | Delete level |

### Transactions (`/api/transactions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List user transactions |
| POST | `/deposit` | Yes | Create deposit |
| POST | `/withdraw` | Yes | Create withdrawal |
| POST | `/transfer` | Yes | Create transfer |

### Dashboard (`/api/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Dashboard statistics |

---

## Common Commands Cheat Sheet

```bash
# Install dependencies
npm install                          # Frontend
cd backend && npm install            # Backend

# Run development servers
npm run dev                          # Frontend (Vite, port 5174)
cd backend && npm run dev            # Backend (Nodemon, port 4000)

# Build for production
npm run build                        # Creates dist/ folder

# Preview production build
npm run preview                      # Serves dist/ on port 4173

# Lint code
npm run lint                         # ESLint check

# Run database migrations
cd backend
node scripts/create_plan_table.js
node scripts/create_level_config_table.js
node scripts/create_transaction_tables.js
node scripts/create_user_plan_table.js
node scripts/add_profile_columns.js
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `CORS error` | Make sure backend `server.js` has the correct frontend URL in `cors({ origin })` |
| `styles.xxx is undefined` | You added a new style but forgot to export it in `styles/index.js` |
| `401 Unauthorized` | JWT cookie expired — log in again |
| `Cannot find module` | Run `npm install` in both `Frontend/` and `Frontend/backend/` |
| `Vite cache stale` | Delete `node_modules/.vite` and restart `npm run dev` |
| `Database connection failed` | Check `DATABASE_URL` in `backend/.env` |
