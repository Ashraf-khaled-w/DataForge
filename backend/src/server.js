import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables relative to this file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import routes
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { initDb } from "./config/initDb.js";

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize database schema
initDb();

// Midlewares
const allowedOrigins = [
  "http://localhost:5173",
  "https://data-forge-lyart.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS policy"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Anti-CSRF Header Verification Middleware
const verifyCsrfHeader = (req, res, next) => {
  if (req.method !== "GET" && req.method !== "OPTIONS" && req.method !== "HEAD") {
    const csrfHeader = req.headers["x-requested-with"];
    if (csrfHeader !== "XMLHttpRequest") {
      return res.status(403).json({
        success: false,
        error: { message: "Security Block: Cross-Site Request Forgery (CSRF) blocked. Missing custom header." }
      });
    }
  }
  next();
};
app.use(verifyCsrfHeader);

// Base diagnostic route
app.get("/", (req, res) => {
  res.send("Hello World");
  console.log("Diagnostic check: User-Agent is", req.headers["user-agent"]);
});

// Register routers (mounted at root to match exact legacy routes structure)
app.use("/", authRoutes);    // exposes: /login, /register, /logout, /me, /auth/guest
app.use("/", workspaceRoutes); // exposes: /workspaces, /workspace/:id, etc.
app.use("/", recordRoutes);    // exposes: /records, /record/:id, etc.
app.use("/", userRoutes);    // exposes: /users, /user/:id, etc.

// Centralized error handling middleware
app.use((err, req, res, next) => {
  // Helper to sanitize sensitive information (e.g. passwords) in request body
  const sanitize = (obj) => {
    if (!obj) return obj;
    const clean = { ...obj };
    const sensitiveKeys = ["password", "password_hash", "token", "secret", "credit_card"];
    for (const key of sensitiveKeys) {
      if (key in clean) clean[key] = "[REDACTED]";
    }
    return clean;
  };

  // Structured logging
  console.error(`\n=== ERROR DETECTED ===`);
  console.error(`Timestamp: ${new Date().toISOString()}`);
  console.error(`Request:   ${req.method} ${req.originalUrl}`);
  console.error(`Params:    ${JSON.stringify(req.params)}`);
  console.error(`Query:     ${JSON.stringify(req.query)}`);
  console.error(`Body:      ${JSON.stringify(sanitize(req.body))}`);
  console.error(`Message:   ${err.message}`);
  console.error(`Stack:\n${err.stack}`);
  console.error(`======================\n`);

  // Respond with correct HTTP status
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error"
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
