import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(authenticateToken);

// Match original API endpoints for user CRUD
router.get("/users", getUsers);
router.get("/user/:id", getUserById);
router.post("/users", createUser);
router.patch("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);

export default router;
