import jwt from "jsonwebtoken";
import db from "../config/db.js";

// Middleware to authenticate JWT token from HTTP-only cookie
export const authenticateToken = async (req, res, next) => {
  // Read token from cookie or fallback to Authorization header
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: "Access denied. No token provided." }
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "super_secret_key_change_me_in_production";
    const decoded = jwt.verify(token, secret);

    // Verify session still exists in the active_sessions table
    if (decoded && decoded.token_id) {
      const sessionResult = await db.query(
        "SELECT id FROM active_sessions WHERE token_id = $1",
        [decoded.token_id]
      );
      if (sessionResult.rows.length === 0) {
        res.clearCookie("token");
        return res.status(401).json({
          success: false,
          error: { message: "جلسة العمل منتهية أو تم تسجيل الدخول من جهاز آخر." }
        });
      }
    }

    req.user = decoded; // Contains id, email, role, manager_id, token_id
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { message: "Invalid or expired token." }
    });
  }
};

// Middleware to check if user has one of the required roles
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: "Unauthorized. Please log in first." }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: "Access denied. Insufficient permissions." }
      });
    }

    next();
  };
};
