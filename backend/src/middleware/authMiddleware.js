import jwt from "jsonwebtoken";

// Middleware to authenticate JWT token from HTTP-only cookie
export const authenticateToken = (req, res, next) => {
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
    req.user = decoded; // Contains id, email, role, manager_id
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
