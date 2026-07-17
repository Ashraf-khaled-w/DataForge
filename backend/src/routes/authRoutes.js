import express from "express";
import { register, login, logout, getMe, guestLogin } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/auth/guest", guestLogin);

// Protected routes
router.get("/me", authenticateToken, getMe);

export default router;
