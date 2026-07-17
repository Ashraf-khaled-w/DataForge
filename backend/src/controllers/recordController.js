import * as xlsx from "xlsx";
import db from "../config/db.js";
import { checkWorkspaceAccess, getSubscriptionPlan } from "./workspaceController.js";

// Helper to get record and verify workspace access
const getRecordWithAccess = async (recordId, userId, userRole, requiredAccess) => {
  const recordResult = await db.query("SELECT * FROM records WHERE id = $1", [recordId]);
  if (recordResult.rows.length === 0) {
    const err = new Error("بيانات السجل غير موجودة");
    err.statusCode = 404;
    throw err;
  }

  const record = recordResult.rows[0];

  // Verify access on the associated workspace
  await checkWorkspaceAccess(record.workspace_id, userId, userRole, requiredAccess);

  return record;
};

// Check if workspace owner's subscription records limit would be exceeded
const verifyRecordLimit = async (workspaceId, incomingCount) => {
  // 1. Get workspace owner
  const workspaceResult = await db.query("SELECT owner_id FROM workspaces WHERE id = $1", [workspaceId]);
  if (workspaceResult.rows.length === 0) {
    const err = new Error("المساحة غير موجودة");
    err.statusCode = 404;
    throw err;
  }
  const ownerId = workspaceResult.rows[0].owner_id;

  // 2. Fetch owner's plan details
  const sub = await getSubscriptionPlan(ownerId);
  const limit = sub.limits.max_records_per_workspace || 50;

  // 3. Count current records in the workspace
  const countResult = await db.query("SELECT COUNT(*) FROM records WHERE workspace_id = $1", [workspaceId]);
  const currentCount = parseInt(countResult.rows[0].count, 10);

  if (currentCount + incomingCount > limit) {
    const err = new Error(
      `لقد تجاوزت الحد الأقصى للسجلات المسموح بها في هذه المساحة لباقة الاشتراك الحالية (${limit} سجل). يرجى الترقية.`
    );
    err.statusCode = 403;
    throw err;
  }
};

export const getRecords = async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let result;
    if (userRole === "admin") {
      result = await db.query("SELECT * FROM records ORDER BY updated_at DESC");
    } else if (userRole === "team_leader") {
      result = await db.query(
        `SELECT DISTINCT r.* 
         FROM records r 
         INNER JOIN workspaces w ON r.workspace_id = w.id 
         LEFT JOIN users u ON w.owner_id = u.id 
         LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $1 
         WHERE w.owner_id = $1 OR u.manager_id = $1 OR wm.user_id = $1
         ORDER BY r.updated_at DESC`,
        [userId]
      );
    } else {
      result = await db.query(
        `SELECT DISTINCT r.* 
         FROM records r 
         INNER JOIN workspaces w ON r.workspace_id = w.id 
         LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $1 
         WHERE w.owner_id = $1 OR wm.user_id = $1
         ORDER BY r.updated_at DESC`,
        [userId]
      );
    }

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createRecord = async (req, res, next) => {
  const { workspace_id, data } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!workspace_id || !data) {
    return res.status(400).json({
      success: false,
      error: { message: "معرف المساحة وبيانات السجل مطلوبة." }
    });
  }

  try {
    // Check write access to workspace
    await checkWorkspaceAccess(workspace_id, userId, userRole, "write");

    // Check plan limits
    await verifyRecordLimit(workspace_id, 1);

    const result = await db.query(
      "INSERT INTO records (workspace_id, data, created_by) VALUES ($1, $2, $3) RETURNING *",
      [workspace_id, JSON.stringify(data), userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getRecordsByWorkspaceId = async (req, res, next) => {
  const { id } = req.params; // workspace_id
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Verify user has read access to workspace
    await checkWorkspaceAccess(id, userId, userRole, "read");

    const result = await db.query(
      "SELECT * FROM records WHERE workspace_id = $1 ORDER BY updated_at DESC",
      [id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getRecordById = async (req, res, next) => {
  const { id } = req.params; // record_id
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const record = await getRecordWithAccess(id, userId, userRole, "read");
    res.status(200).json(record);
  } catch (error) {
    next(error);
  }
};

export const updateRecord = async (req, res, next) => {
  const { id } = req.params; // record_id
  const { data } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Verify write access to associated workspace
    await getRecordWithAccess(id, userId, userRole, "write");

    const result = await db.query(
      "UPDATE records SET data = COALESCE($1, data), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [data ? JSON.stringify(data) : null, id]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteRecord = async (req, res, next) => {
  const { id } = req.params; // record_id
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Verify write access (required to delete)
    await getRecordWithAccess(id, userId, userRole, "write");

    const result = await db.query("DELETE FROM records WHERE id = $1 RETURNING *", [id]);

    res.status(200).json({
      success: true,
      message: "تم حذف السجل بنجاح",
      deleted: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const uploadRecords = async (req, res, next) => {
  const { workspace_id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: "لم يتم رفع ملف" }
    });
  }

  try {
    // Verify write access
    await checkWorkspaceAccess(workspace_id, userId, userRole, "write");

    // Read file buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const recordsData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    if (recordsData.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "الملف فارغ" }
      });
    }

    // Verify limit with incoming count
    await verifyRecordLimit(workspace_id, recordsData.length);

    // High performance bulk insert using jsonb_array_elements
    const insertQuery = `
      INSERT INTO records (workspace_id, data, created_by) 
      SELECT $1, jsonb_array_elements($2), $3
    `;

    await db.query(insertQuery, [workspace_id, JSON.stringify(recordsData), userId]);

    res.status(200).json({
      success: true,
      message: `تم رفع ${recordsData.length} سجل بنجاح`
    });
  } catch (error) {
    next(error);
  }
};
