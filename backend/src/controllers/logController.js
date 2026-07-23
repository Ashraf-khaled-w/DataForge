import db from "../config/db.js";
import { checkWorkspaceAccess } from "./workspaceController.js";
import { createActivityLog } from "../utils/activityLogger.js";

// GET /logs - Fetch dashboard activity feed with strict role-based scoping
export const getDashboardLogs = async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let result;
    if (userRole === "admin") {
      // Admins see everything
      const query = `
        SELECT l.*, u.full_name as user_name, w.title as workspace_title 
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        LEFT JOIN workspaces w ON l.workspace_id = w.id
        ORDER BY l.created_at DESC
        LIMIT 100
      `;
      result = await db.query(query);
    } else if (userRole === "team_leader") {
      // Team leaders (managers) see logs for workspaces they own, members in their workspaces, or users they manage
      const query = `
        SELECT DISTINCT l.*, u.full_name as user_name, w.title as workspace_title 
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        LEFT JOIN workspaces w ON l.workspace_id = w.id
        LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
        WHERE w.owner_id = $1 OR u.manager_id = $1 OR wm.user_id = $1
        ORDER BY l.created_at DESC
        LIMIT 100
      `;
      result = await db.query(query, [userId]);
    } else {
      // Normal users do not see logs
      return res.status(200).json([]);
    }

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

// GET /workspace/:workspaceId/logs - Fetch audit logs for a single workspace
export const getWorkspaceLogs = async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Verify read access
    await checkWorkspaceAccess(workspaceId, userId, userRole, "read");

    // 2. Normal users are blocked from seeing any logs
    if (userRole === "user") {
      return res.status(403).json({
        success: false,
        error: { message: "Access denied. Insufficient permissions to view activity logs." }
      });
    }

    // 3. Admin or Team Leader can fetch the logs
    const query = `
      SELECT l.*, u.full_name as user_name 
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.workspace_id = $1
      ORDER BY l.created_at DESC
      LIMIT 100
    `;
    const result = await db.query(query, [workspaceId]);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};
