# 🎨 DataForge Frontend Client

A premium, responsive React web application built with Vite and Tailwind CSS. It serves as a dynamic workspace builder, spreadsheet viewer, and real-time statistics dashboard.

---

## 🚀 Key Frontend Features

### 1. Dynamic UI Schema Renderer
* Reads the custom column configurations (schema layout) defined by the user in each Workspace.
* Dynamically adapts forms, patient grids, filters, and charts to support **text**, **integers**, **decimals (floats)**, and **dropdown option select** variable types on-the-fly.

### 2. Client-Side Serverless Wakeup Checker
* Configured a custom checking wrapper in `App.jsx` to resolve PaaS free-tier cold starts.
* Checks server connection on mount; if the backend takes longer than 1.5 seconds to reply, it displays an animated, glassmorphic wakeup splash loader that loops through comedy status quotes while polling the backend server.

### 3. Interactive Data Grid & Client Sorting
* Displays records under a sequential counter `#1, #2, #3...` to hide raw database UUIDs.
* Implements dynamic header click-sorting (ascending/descending) handling numerical, text, and date columns.
* Supports xlsx download, generating clean spreadsheet files containing the dynamic records list.

### 4. Real-time Charts & Analytics (Chart.js)
* Visualizes data distributions dynamically using Doughnut, Bar, and Line charts.
* The analysis engine processes decimal variables using precise floating-point rounding (averages showing to 2 decimal places, intervals showing ranges to 1 decimal place) and group boundaries.

### 5. In-Memory Session Security
* Authenticates session status strictly in-memory using React Context (`AuthContext.jsx`).
* Never uses `localStorage` or `sessionStorage` for storing tokens, preventing token extraction via malicious XSS injection scripts.

---

## 🛠 Tech Stack
* **Vite & React (v19)**: Build tool and UI library.
* **Tailwind CSS**: Core glassmorphic styling system.
* **React Router Dom (v6)**: Declarative layout routing and legacy path redirects.
* **Chart.js & React-Chartjs-2**: High-performance canvas chart engines.
* **Axios**: Promised-based HTTP client (with `withCredentials = true` configured globally for cookie exchange).

---

## 💡 Startup & Installation
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the Vite local development server:
   ```bash
   pnpm run dev
   ```
3. Compile for production:
   ```bash
   pnpm run build
   ```
