import db from "../config/db.js";
import { createActivityLog } from "../utils/activityLogger.js";

// Helper to check user subscription and limits
export const getSubscriptionPlan = async (userId) => {
  const result = await db.query(
    `SELECT p.name, p.limits, s.status, s.current_period_end
     FROM subscriptions s
     JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = $1`,
    [userId]
  );
  if (result.rows.length === 0) {
    // Default to free
    return {
      name: "free",
      limits: { max_workspaces: 2, max_records_per_workspace: 50, max_seats_per_workspace: 0 },
      status: "active",
      current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)
    };
  }
  const sub = result.rows[0];
  const isExpired = new Date(sub.current_period_end) < new Date();
  if (isExpired || sub.status === "expired" || sub.status === "inactive") {
    return {
      name: sub.name,
      limits: { max_workspaces: 2, max_records_per_workspace: 50, max_seats_per_workspace: 0 },
      status: "expired",
      current_period_end: sub.current_period_end
    };
  }
  return sub;
};

// Access validation helper
export const checkWorkspaceAccess = async (workspaceId, userId, userRole, requiredAccess) => {
  const result = await db.query(
    `SELECT w.*, u.manager_id, wm.role as member_role 
     FROM workspaces w
     LEFT JOIN users u ON w.owner_id = u.id
     LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $2
     WHERE w.id = $1`,
    [workspaceId, userId]
  );

  if (result.rows.length === 0) {
    const err = new Error("المساحة غير موجودة");
    err.statusCode = 404;
    throw err;
  }

  const workspace = result.rows[0];

  // Admin has full access
  if (userRole === "admin") return workspace;

  // Owner has full access
  if (workspace.owner_id === userId) return workspace;

  // Team Leader has full access if owner is a team member managed by them
  if (userRole === "team_leader" && workspace.manager_id === userId) return workspace;

  // Collaborate access (members)
  if (requiredAccess === "delete") {
    // Collaborators can never delete a workspace
    const err = new Error("غير مسموح لك بحذف هذه المساحة.");
    err.statusCode = 403;
    throw err;
  }

  if (requiredAccess === "write") {
    if (workspace.member_role === "editor") {
      return workspace;
    }
    const err = new Error("غير مسموح لك بالتعديل في هذه المساحة.");
    err.statusCode = 403;
    throw err;
  }

  if (requiredAccess === "read") {
    if (workspace.member_role) {
      return workspace;
    }
    const err = new Error("غير مسموح لك باستعراض هذه المساحة.");
    err.statusCode = 403;
    throw err;
  }

  return workspace;
};

export const getWorkspaces = async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let result;
    if (userRole === "admin") {
      result = await db.query(
        `SELECT DISTINCT w.*, u.full_name as owner_name 
         FROM workspaces w 
         LEFT JOIN users u ON w.owner_id = u.id
         ORDER BY w.created_at DESC`
      );
    } else if (userRole === "team_leader") {
      result = await db.query(
        `SELECT DISTINCT w.*, u.full_name as owner_name 
         FROM workspaces w 
         LEFT JOIN users u ON w.owner_id = u.id 
         LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $1 
         WHERE w.owner_id = $1 OR u.manager_id = $1 OR wm.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );
    } else {
      result = await db.query(
        `SELECT DISTINCT w.*, u.full_name as owner_name 
         FROM workspaces w 
         LEFT JOIN users u ON w.owner_id = u.id 
         LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $1 
         WHERE w.owner_id = $1 OR wm.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );
    }
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const workspace = await checkWorkspaceAccess(id, userId, userRole, "read");
    res.status(200).json(workspace);
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req, res, next) => {
  const { title, description, config } = req.body;
  const userId = req.user.id;

  if (!title || !config) {
    return res.status(400).json({
      success: false,
      error: { message: "العنوان وإعدادات الحقول مطلوبة." }
    });
  }

  try {
    // Check user plan workspace limit
    const sub = await getSubscriptionPlan(userId);
    const countResult = await db.query("SELECT COUNT(*) FROM workspaces WHERE owner_id = $1", [userId]);
    const currentWorkspacesCount = parseInt(countResult.rows[0].count, 10);
    const limit = sub.limits.max_workspaces || 2;

    if (currentWorkspacesCount >= limit) {
      return res.status(403).json({
        success: false,
        error: { message: `لقد تجاوزت الحد الأقصى للمساحات المتاحة لباقة الاشتراك الحالية (${limit} مساحة). يرجى الترقية.` }
      });
    }

    const result = await db.query(
      "INSERT INTO workspaces (owner_id, title, description, config) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, title, description || null, JSON.stringify(config)]
    );
    const newWorkspace = result.rows[0];

    // Log workspace creation event
    await createActivityLog(newWorkspace.id, userId, "workspace_created", `Created workspace: ${title}`);

    res.status(201).json(newWorkspace);
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const updates = req.body;

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: "لا توجد بيانات للتحديث." }
    });
  }

  try {
    await checkWorkspaceAccess(id, userId, userRole, "write");

    const queryParts = [];
    const values = [];

    keys.forEach((key) => {
      if (key !== "id" && key !== "owner_id") {
        queryParts.push(`${key} = $${values.length + 1}`);
        let value = updates[key];
        if (key === "config" && typeof value === "object") {
          value = JSON.stringify(value);
        }
        values.push(value);
      }
    });

    if (values.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "تحديثات غير صالحة." }
      });
    }

    values.push(id);
    const query = `UPDATE workspaces SET ${queryParts.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await db.query(query, values);
    const updatedWorkspace = result.rows[0];

    // Log workspace metadata update event
    await createActivityLog(id, userId, "workspace_updated", `Updated workspace settings: ${keys.filter(k => k !== "id" && k !== "owner_id").join(", ")}`);

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    next(error);
  }
};

export const updateWorkspaceConfig = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { config } = req.body;

  if (!config) {
    return res.status(400).json({
      success: false,
      error: { message: "Missing columns config" }
    });
  }

  try {
    await checkWorkspaceAccess(id, userId, userRole, "write");

    const result = await db.query(
      "UPDATE workspaces SET config = config || $1 WHERE id = $2 RETURNING *",
      [JSON.stringify(config), id]
    );
    const updatedWorkspace = result.rows[0];

    // Log workspace columns configuration config schema update event
    await createActivityLog(id, userId, "workspace_config_updated", "Updated workspace columns variables layout schema");

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    await checkWorkspaceAccess(id, userId, userRole, "delete");

    const result = await db.query("DELETE FROM workspaces WHERE id = $1 RETURNING *", [id]);
    res.status(200).json({
      success: true,
      message: "تم حذف المساحة بنجاح",
      deleted: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
