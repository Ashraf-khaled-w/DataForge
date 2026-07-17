# 🛠️ DataForge Backend API

A high-performance, secure Node.js & Express RESTful API designed for dynamic data cataloging, workspace variable modeling, and bulk data ingestion. The system utilizes PostgreSQL's JSONB capabilities to allow on-the-fly database modeling without database migrations.

---

## 🚀 Key Technical Features

### 1. Schema-Less Modeling via PostgreSQL JSONB
To allow users to define custom tables (workspaces) with their own column configurations (e.g., text, number, decimal, select lists), attributes are stored dynamically in a PostgreSQL `JSONB` column.
```javascript
// Inserting records dynamically without rigid database columns
const result = await db.query(
  "INSERT INTO records (workspace_id, data, created_by) VALUES ($1, $2, $3) RETURNING *",
  [workspaceId, JSON.stringify(recordData), userId]
);
```

### 2. High-Performance Bulk Data Ingestion
To prevent server memory bloat and reduce network latency during Excel/CSV uploads:
* Parse spreadsheets directly from RAM via **SheetJS (xlsx)** and **Multer** (in-memory storage).
* Bulk insert rows into PostgreSQL using `jsonb_array_elements` in a single transaction, shifting parsing performance directly to the database engine.
```javascript
const query = `
  INSERT INTO records (workspace_id, data, created_by) 
  SELECT $1, jsonb_array_elements($2), $3
`;
await db.query(query, [workspaceId, JSON.stringify(recordsArray), userId]);
```

### 3. Session Security & HTTP-Only Cookie Authentication
To eliminate XSS (Cross-Site Scripting) token theft:
* Implemented session authentication using `cookie-parser`.
* JWT session tokens are signed and delivered in an **HTTP-Only, SameSite=Lax** cookie.
* Frontend keeps authentication strictly in-memory (no local storage exposure).

### 4. Subscription Limit Validations
* Enforces workspace creation and record insertion limits based on user subscription tiers (`free`, `pro`, `team`).
* Automatically runs background cron checks to purge expired 24-hour trials and temporary guest entries.

---

## 🛠 Tech Stack
* **Node.js & Express**: Event-driven runtime environment and minimal REST framework.
* **PostgreSQL (Neon.tech / pg)**: Relational storage engine with native JSONB indexing.
* **Bcryptjs & JsonWebToken**: Secure authentication password hashing and token signs.
* **SheetJS & Multer**: High-performance in-memory spreadsheet parsing.

---

## 💡 Startup & Installation
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure your `.env` variables:
   ```env
   PORT=3000
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_jwt_secret_key
   ```
3. Initialize the database schema and seed the default test accounts:
   ```bash
   node src/config/initDb.js
   ```
4. Start the server:
   ```bash
   node src/server.js
   ```