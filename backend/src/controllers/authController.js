import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_change_me_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Helper function to generate JWT token with unique session token_id
const generateToken = (user, tokenId) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      manager_id: user.manager_id,
      token_id: tokenId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper function to set JWT token cookie
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  });
};

export const register = async (req, res, next) => {
  const { full_name, email, password, role, manager_id, plan_name } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: "Please provide full_name, email, and password." }
    });
  }

  try {
    // Check if email already exists
    const emailCheck = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Email is already registered." }
      });
    }

    // Validate manager_id if provided
    if (manager_id) {
      const managerCheck = await db.query("SELECT id, role FROM users WHERE id = $1", [manager_id]);
      if (managerCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: "Invalid manager_id. Manager not found." }
        });
      }
    }

    // Validate role
    const userRole = role || "user";
    const allowedRoles = ["admin", "team_leader", "user"];
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}` }
      });
    }

    // Validate subscription plan selection
    const chosenPlanName = plan_name || "free";
    const allowedPlans = ["free", "pro", "team"];
    if (!allowedPlans.includes(chosenPlanName)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid plan. Allowed plans: ${allowedPlans.join(", ")}` }
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into DB
    const result = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role, manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, manager_id, created_at",
      [full_name, email, passwordHash, userRole, manager_id || null]
    );

    const user = result.rows[0];

    // Find corresponding plan ID
    const planResult = await db.query("SELECT id, limits FROM plans WHERE name = $1", [chosenPlanName]);
    let limits = {};
    if (planResult.rows.length > 0) {
      const planId = planResult.rows[0].id;
      limits = planResult.rows[0].limits;
      // Set current period end based on plan (1-day trial for pro/team, 100 years for free)
      const expirationPeriod = chosenPlanName === "free" ? 100 * 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const periodEnd = new Date(Date.now() + expirationPeriod);
      await db.query(
        "INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4)",
        [user.id, planId, "active", periodEnd]
      );
      user.subscription = {
        status: "active",
        current_period_end: periodEnd,
        plan_name: chosenPlanName,
        limits
      };
    }

    // Enforce 1 active session limit and log in
    const tokenId = crypto.randomUUID();
    await db.query("DELETE FROM active_sessions WHERE user_id = $1", [user.id]);
    await db.query("INSERT INTO active_sessions (user_id, token_id) VALUES ($1, $2)", [user.id, tokenId]);

    // Generate JWT and set in cookie
    const token = generateToken(user, tokenId);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: "Please provide email and password." }
    });
  }

  try {
    // Find user by email
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid email or password." }
      });
    }

    const user = result.rows[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid email or password." }
      });
    }

    // Fetch subscription details
    const subResult = await db.query(
      `SELECT s.status, s.current_period_end, p.name as plan_name, p.limits
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1`,
      [user.id]
    );

    if (subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      const isExpired = new Date(sub.current_period_end) < new Date();
      user.subscription = {
        status: isExpired ? "expired" : sub.status,
        current_period_end: sub.current_period_end,
        plan_name: sub.plan_name,
        limits: isExpired ? { max_workspaces: 2, max_records_per_workspace: 50, max_seats_per_workspace: 0 } : sub.limits
      };
    } else {
      user.subscription = {
        status: "active",
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        plan_name: "free",
        limits: { max_workspaces: 2, max_records_per_workspace: 50, max_seats_per_workspace: 0 }
      };
    }

    // Enforce 1 active session limit and log in
    const tokenId = crypto.randomUUID();
    await db.query("DELETE FROM active_sessions WHERE user_id = $1", [user.id]);
    await db.query("INSERT INTO active_sessions (user_id, token_id) VALUES ($1, $2)", [user.id, tokenId]);

    // Generate token
    const token = generateToken(user, tokenId);
    setTokenCookie(res, token);

    // Remove password hash from response
    delete user.password_hash;

    res.status(200).json({
      success: true,
      message: "Login successful",
      user
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.token_id) {
          await db.query("DELETE FROM active_sessions WHERE token_id = $1", [decoded.token_id]);
        }
      } catch (err) {
        // Ignore parsing issues (expired/malformed token)
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, full_name, email, role, manager_id, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found." }
      });
    }

    const user = result.rows[0];

    // Fetch subscription details
    const subResult = await db.query(
      `SELECT s.status, s.current_period_end, p.name as plan_name, p.limits
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1`,
      [user.id]
    );

    if (subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      const isExpired = new Date(sub.current_period_end) < new Date();
      user.subscription = {
        status: isExpired ? "expired" : sub.status,
        current_period_end: sub.current_period_end,
        plan_name: sub.plan_name,
        limits: isExpired ? { max_workspaces: 2, max_records_per_workspace: 50, max_seats_per_workspace: 0 } : sub.limits
      };
    } else {
      user.subscription = {
        status: "active",
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        plan_name: "free",
        limits: { max_workspaces: 2, max_records_per_workspace: 50, max_seats_per_workspace: 0 }
      };
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Guest registration and instant login
export const guestLogin = async (req, res, next) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestEmail = `guest_${randomSuffix}@dataforge.com`;
    const guestName = `Guest User ${randomSuffix}`;

    // Hash guest password
    const salt = await bcrypt.genSalt(10);
    const dummyHash = await bcrypt.hash("GuestPassword@123", salt);

    // Insert guest user
    const userResult = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, created_at",
      [guestName, guestEmail, dummyHash, "user"]
    );
    const user = userResult.rows[0];

    // Find Pro Plan ID
    const planResult = await db.query("SELECT id, limits FROM plans WHERE name = $1", ["pro"]);
    let limits = { max_workspaces: 9999, max_records_per_workspace: 99999, max_seats_per_workspace: 0 };
    if (planResult.rows.length > 0) {
      const planId = planResult.rows[0].id;
      limits = planResult.rows[0].limits;
      // Set to expire in 24 hours
      const periodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.query(
        "INSERT INTO subscriptions (user_id, plan_id, status, current_period_end) VALUES ($1, $2, $3, $4)",
        [user.id, planId, "active", periodEnd]
      );
      user.subscription = {
        status: "active",
        current_period_end: periodEnd,
        plan_name: "pro",
        limits
      };
    }

    // Auto-create a demo workspace for this guest user
    const config = {
      fields: [
        { key: "patient_name", label: "اسم المريض", type: "text", required: true, is_analytic: false },
        { key: "age", label: "العمر", type: "number", required: true, is_analytic: true },
        { key: "area", label: "المنطقة", type: "text", required: true, is_analytic: true },
        { key: "gender", label: "النوع", type: "select", required: true, is_analytic: true, options: ["Male", "Female"] },
        { key: "adhd_score", label: "مقياس الـ ADHD", type: "number", required: true, is_analytic: true }
      ]
    };

    const wsResult = await db.query(
      "INSERT INTO workspaces (owner_id, title, description, config) VALUES ($1, $2, $3, $4) RETURNING id",
      [user.id, "Clinical Study - ADHD Research (Demo)", "Sample workspace showing ADHD patient diagnostic indicators and study metrics.", JSON.stringify(config)]
    );
    const workspaceId = wsResult.rows[0].id;

    // Auto-insert sample records for this workspace
    const sampleData = [
      { patient_name: "احمد علي", age: 10, area: "Cairo", gender: "Male", adhd_score: 48 },
      { patient_name: "سارة محمد", age: 8, area: "Alexandria", gender: "Female", adhd_score: 62 },
      { patient_name: "يوسف محمود", age: 12, area: "Giza", gender: "Male", adhd_score: 35 },
      { patient_name: "فاطمة حسن", age: 9, area: "Tanta", gender: "Female", adhd_score: 55 },
      { patient_name: "كريم عمرو", age: 11, area: "Cairo", gender: "Male", adhd_score: 70 }
    ];

    for (const record of sampleData) {
      await db.query(
        "INSERT INTO records (workspace_id, data, created_by) VALUES ($1, $2, $3)",
        [workspaceId, JSON.stringify(record), user.id]
      );
    }

    // Enforce 1 active session limit and log in
    const tokenId = crypto.randomUUID();
    await db.query("DELETE FROM active_sessions WHERE user_id = $1", [user.id]);
    await db.query("INSERT INTO active_sessions (user_id, token_id) VALUES ($1, $2)", [user.id, tokenId]);

    // Generate JWT token
    const token = generateToken(user, tokenId);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Guest Login successful",
      user
    });
  } catch (error) {
    next(error);
  }
};
