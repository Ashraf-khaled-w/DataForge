# 🗃️ DataForge — Dynamic Workspace & No-Code Data Modeling Platform

<div align="center">

![DataForge Minimalist Monochrome Platform](docs/screenshots/01_home_hero.png)

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Chart.js](https://img.shields.io/badge/Chart.js-v4.5-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)](#license)

</div>

---

## 🌟 Executive Summary

**DataForge** is a full-stack, enterprise-grade **Dynamic Workspace & Schema Modeling SaaS Platform**. Built with React 19, Tailwind CSS v4, Node.js, Express, and Neon PostgreSQL, DataForge enables organizations to construct custom dataset schemas on-the-fly without database migrations, ingest thousands of records via high-speed Excel stream parsing, enforce single-session security constraints, and analyze categorical and numerical data in real-time through vibrant analytical charts.

Designed with an architectural **Minimalist Monochrome** design system, DataForge delivers high contrast, sharp 0px architectural borders, editorial typography (`Playfair Display`, `Source Serif 4`, `JetBrains Mono`), and instant zero-latency UI state transitions.

---

## ⚡ Key Architectural Highlights

* **Dynamically Configurable Schemas (`JSONB`)**: Define custom fields (text, numerical, decimals, dates, select dropdowns) per workspace. Data is stored in a PostgreSQL `JSONB` column, enabling schema flexibility without running SQL migrations.
* **Vibrant Analytics Engine**: Automatically computes min, max, mean, and distribution metrics, rendering real-time Chart.js doughnut and line visualizers with custom high-contrast color palettes.
* **Enterprise Security & Session Control**:
  * **Single Active Session Limit**: Prevents multi-device account sharing by tracking active token UUIDs (`JTI`) in `active_sessions`.
  * **In-Memory Token Context**: JWTs are transferred via HTTP-Only, SameSite cookies and verified in React memory (`AuthContext`), mitigating XSS token theft.
  * **Custom CSRF Middleware**: Validates custom request headers on mutating endpoints.
* **Role-Based Access & Global Audit Feed**:
  * **Admin**: Unrestricted access to all system workspaces, user management, and global audit logs.
  * **Manager (Team Leader)**: Scoped visibility into team activity feeds and member dataset modifications.
  * **User**: Workspace record management without permission to access system audit feeds.
* **High-Speed RAM Stream File Ingestion**: Processes multi-row Excel spreadsheets (`.xlsx`, `.csv`) directly from memory buffers using `SheetJS` and PostgreSQL `jsonb_array_elements` in unified database transactions.

---

## 📸 Platform Tour & Visual Gallery

### 1. Landing Page & Editorial Hero Layout
A stark visual showcase highlighting platform capabilities, luxury editorial typography, 4px section rules, and tiered plan offerings.

![Home Hero Banner](docs/screenshots/01_home_hero.png)

---

### 2. Authentication & Guest Access Shell
Secure login and registration interface supporting role selection, guest demo instant authentication, and 0px input fields.

![Authentication Screen](docs/screenshots/03_auth_login.png)

---

### 3. Workspaces Directory & On-the-Fly Schema Builder
Workspace management view featuring search filters, field type definitions, analytic flag controls, and schema creation modals.

| Workspaces Directory | Schema Builder Modal |
| :---: | :---: |
| ![Workspaces Directory](docs/screenshots/04_workspaces_list.png) | ![Schema Builder Modal](docs/screenshots/05_schema_builder_modal.png) |

---

### 4. Interactive Data Grid & Record Entry
Architectural table layout supporting custom field display, record insertion, bulk Excel imports, and sequential row indexes (`#1, #2...`).

| Records Data Grid | Add Record Modal |
| :---: | :---: |
| ![Records Data Grid](docs/screenshots/06_records_datagrid.png) | ![Record Entry Modal](docs/screenshots/07_record_entry_modal.png) |

---

### 5. Real-Time Analytics Dashboard & Vibrant Charts
Computes workspace-level dataset metrics in real-time, rendering distinct color-coded Doughnut distribution charts and Line trend graphs.

![Analytics Dashboard Overview](docs/screenshots/08_analytics_dashboard.png)

![Vibrant Analytical Charts](docs/screenshots/09_vibrant_charts.png)

---

### 6. Role-Scoped Activity Audit Feed
Admin and Team Leader activity feed displaying user action timestamps, workspace mutation details, and user initials badges.

![Global Activity Audit Feed](docs/screenshots/10_activity_audit_log.png)

---

### 7. Editorial About & Support Center
Magazine-style layout featuring serif drop-caps, sharp milestone boxes, and interactive support request forms.

| Editorial About Page | Support & Contact Directory |
| :---: | :---: |
| ![About Page](docs/screenshots/11_about_editorial.png) | ![Support Directory](docs/screenshots/12_support_page.png) |

---

## 🛠️ Tech Stack & Architecture

### **Frontend Architecture**
* **Framework**: React 19 (Vite SPA)
* **Styling**: Tailwind CSS v4 (`@theme` customized tokens)
* **Typography**: Google Fonts (`Playfair Display`, `Source Serif 4`, `JetBrains Mono`)
* **State & Routing**: React Context API (`AuthContext`), React Router v7
* **Data Visualization**: Chart.js 4.5, `react-chartjs-2`

### **Backend Architecture**
* **Runtime**: Node.js v24 (ES Modules)
* **API Framework**: Express.js
* **Database**: PostgreSQL (Neon.tech Serverless Cloud)
* **Authentication**: JSON Web Tokens (JWT), Bcryptjs, HTTP-Only Cookie Session Store
* **File Upload**: Multer (Memory Storage Buffer), SheetJS (`xlsx`)

---

## 📊 Role & Permission Matrix

| Feature / Action | Admin | Manager (Team Leader) | Normal User | Guest User |
| :--- | :---: | :---: | :---: | :---: |
| **Create & Manage Workspaces** | ✅ Full Access | ✅ Owned Workspaces | ✅ Tier Limited | ⚡ Trial (2 Workspaces) |
| **Ingest Records & Excel Upload** | ✅ | ✅ | ✅ | ✅ |
| **View Variable Analytics** | ✅ | ✅ | ✅ | ✅ |
| **View Audit Logs Feed** | ✅ Global Feed | ✅ Team Workspaces Only | ❌ Hidden | ❌ Hidden |
| **User Directory Management** | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Local Development & Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Ashraf-khaled-w/DataForge.git
cd DataForge
```

### 2. Backend Setup
```bash
cd backend
pnpm install

# Initialize PostgreSQL schema tables and indexes
node src/config/initDb.js

# Start Express Server on http://localhost:3000
pnpm start
```

### 3. Frontend Setup
```bash
cd ../frontend/my-research-app
pnpm install

# Start Vite Development Server on http://localhost:5173
pnpm run dev
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with precision by <strong>Ashraf Khaled</strong></sub>
</div>
