# 🗃️ DataForge: Dynamic Workspace & Custom Data Modeling Platform

A full-stack, secure, and responsive web platform designed to let users create custom workspaces, define schema configurations (variable models), and upload/manage dataset records with real-time analytics.

---

## 📁 Repository Structure
This repository is organized as a unified monorepo:
*   **[`/backend`](file:///d:/0_Web_Apps/Full%20stack/Projects/DataForg/backend)**: Express.js API, PostgreSQL database config, authentication, and Excel file ingestion handlers.
*   **[`/frontend`](file:///d:/0_Web_Apps/Full%20stack/Projects/DataForg/frontend/my-research-app)**: Vite/React SPA, Tailwind CSS v4 styling, in-memory session auth context, interactive data grid, and Chart.js analytics dashboard.

---

## 🚀 Key Platform Features

1.  **On-the-Fly Database Schema Builder**: Define custom dataset columns (text, integers, decimals/floats, dropdown options) dynamically in the frontend. Data is stored in a PostgreSQL `JSONB` column, enabling schema-less flexibility without requiring SQL migrations.
2.  **In-Memory Session Security**: Employs HTTP-Only, SameSite cookies for session tokens. Session states are maintained strictly in React memory (`AuthContext`), eliminating XSS (Cross-Site Scripting) token theft.
3.  **High-Performance Bulk Import**: Excel/CSV files are processed directly from RAM (Multer Memory Storage). Inserting thousands of records runs in milliseconds using PostgreSQL `jsonb_array_elements` in a single transaction.
4.  **Resilient Client Connection Loader**: Features a built-in wakeup status check in the frontend client. If a PaaS host (like Render) is asleep due to inactivity, the app displays an animated glassmorphic splash loader showing attempts and rotating comedy status quotes.
5.  **Multi-Tier Subscription Plan Limits**: Dynamically checks user workspace and insertion limits based on their subscription status (`free`, `pro`, `team`).
6.  **Interactive Data Grid & Analytics Dashboard**: Supports interactive header sorting on numerical/decimal/date attributes, sequential row identifiers to mask database UUIDs, Excel exports, and real-time Chart.js visual breakdown.

---

## 🛠️ Global Tech Stack
*   **Frontend**: React (Vite), Tailwind CSS, React Router Dom, Chart.js, Axios.
*   **Backend**: Node.js, Express.js, PostgreSQL (Neon.tech / `pg`), Multer, SheetJS (`xlsx`), Bcryptjs, JWT.

---

## 💡 Quick Start

### 1. Backend Setup
```bash
cd backend
pnpm install
# Configure your backend/.env (see backend/README.md)
node src/config/initDb.js   # Seed database tables and test accounts
node src/server.js          # Starts backend on http://localhost:3000
```

### 2. Frontend Setup
```bash
cd frontend/my-research-app
pnpm install
pnpm run dev                # Starts Vite development server
```
