import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables relative to this file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;

const db = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_DATABASE || "reports",
        password: process.env.DB_PASSWORD || "",
        port: parseInt(process.env.DB_PORT || "5432", 10),
      }
);

// Test connection on startup
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Connected to PostgreSQL successfully!");
  }
});

export default db;
