# 🏥 Medical Research Data API

A robust, high-performance Backend API designed for managing medical research data and patient records. This project leverages PostgreSQL's advanced JSONB capabilities to provide a schema-less, flexible data structure suitable for dynamic research requirements.

---

## 🚀 Key Technical Features

### 1. Schema Flexibility with JSONB
We utilize PostgreSQL `JSONB` columns to store patient data. This eliminates the need for rigid schemas, allowing researchers to define dynamic column configurations for different studies.

```javascript
// Patients data stored as flexible JSONB objects
const result = await db.query(
  "INSERT INTO patients_data (study_id, data) VALUES ($1, $2)",
  [study_id, JSON.stringify(patient)]
);
```

### 2. High-Performance Bulk Insertion
To handle large datasets efficiently, we utilize `jsonb_array_elements`. This allows sending the entire Excel dataset as a single array, letting the database engine handle the parsing and insertion internally, which significantly reduces network latency.

```javascript
const insertQuery = "INSERT INTO patients_data (study_id, data) SELECT $1, jsonb_array_elements($2)";
await db.query(insertQuery, [study_id, JSON.stringify(patientsData)]);
```

### 3. Connection Pooling
Instead of creating a new connection for every request, we use `pg.Pool`. This dramatically improves throughput and ensures the API stays responsive under load.

```javascript
const pool = new Pool({ /* connection config */ });
```

### 4. Efficient File Processing
We integrate `multer` with memory storage and `xlsx` to parse files directly from RAM. This avoids unnecessary disk I/O, keeping the server clean and fast.

---

## 🛠 Tech Stack

*   **Node.js & Express**: Lightweight, fast, and minimal web application framework.
*   **PostgreSQL**: Reliable relational database storage equipped with powerful JSONB indexing capabilities.
*   **Multer & SheetJS (xlsx)**: Utilized for seamless, in-memory Excel and CSV parsing.

---

## 💡 Why this architecture?

*   **Future-Proof**: The `columns_config` system allows the frontend to dynamically render UI based on study needs without requiring database schema or backend modifications.
*   **Scalable**: The bulk insertion logic ensures that importing thousands of patient records happens in milliseconds.