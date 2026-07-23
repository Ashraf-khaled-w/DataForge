import express from "express";
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  updateWorkspaceConfig,
  deleteWorkspace
} from "../controllers/workspaceController.js";
import { getDashboardLogs, getWorkspaceLogs } from "../controllers/logController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(authenticateToken);

// Log routes
router.get("/logs", getDashboardLogs);
router.get("/workspace/:workspaceId/logs", getWorkspaceLogs);

// Workspace routes
router.get("/workspaces", getWorkspaces);
router.get("/workspace/:id", getWorkspaceById);
router.post("/workspaces", createWorkspace);
router.patch("/workspace/:id", updateWorkspace);
router.patch("/workspace/:id/config", updateWorkspaceConfig);
router.delete("/workspace/:id", deleteWorkspace);

export default router;
