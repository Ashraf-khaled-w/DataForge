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

// Validate JSONB records dynamic fields against workspace schema config
const validateRecordData = async (workspaceId, data) => {
  if (!data || typeof data !== "object") {
    const err = new Error("بنية البيانات غير صالحة");
    err.statusCode = 400;
    throw err;
  }

  const wsResult = await db.query("SELECT config FROM workspaces WHERE id = $1", [workspaceId]);
  if (wsResult.rows.length === 0) {
    const err = new Error("المساحة غير موجودة");
    err.statusCode = 404;
    throw err;
  }

  const ws = wsResult.rows[0];
  let parsedConfig;
  try {
    parsedConfig = typeof ws.config === "string" ? JSON.parse(ws.config) : ws.config;
  } catch (e) {
    const err = new Error("فشل في قراءة إعدادات حقول المساحة");
    err.statusCode = 500;
    throw err;
  }

  const fields = parsedConfig?.fields || [];

  for (const field of fields) {
    const val = data[field.key];

    // Check required fields
    if (field.required) {
      if (val === undefined || val === null || String(val).trim() === "") {
        const err = new Error(`الحلق "${field.label || field.key}" مطلوب.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Type checking
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      if (field.type === "number" || field.type === "decimal") {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          const err = new Error(`قيمة الحقل "${field.label || field.key}" يجب أن تكون رقماً.`);
          err.statusCode = 400;
          throw err;
        }
        if (field.type === "number" && !Number.isInteger(numVal)) {
          const err = new Error(`قيمة الحقل "${field.label || field.key}" يجب أن تكون رقماً صحيحاً (بدون فواصل).`);
          err.statusCode = 400;
          throw err;
        }
      }

      if (field.type === "select" && field.options && field.options.length > 0) {
        if (!field.options.includes(String(val))) {
          const err = new Error(`قيمة الحقل "${field.label || field.key}" غير موجودة في قائمة الخيارات.`);
          err.statusCode = 400;
          throw err;
        }
      }
    }
  }

  // Basic sanitization to prevent Stored XSS injection on text parameters
  const sanitizedData = { ...data };
  for (const key of Object.keys(sanitizedData)) {
    if (typeof sanitizedData[key] === "string") {
      sanitizedData[key] = sanitizedData[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    }
  }

  return sanitizedData;
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

    // Validate schema
    const validatedData = await validateRecordData(workspace_id, data);

    // Check plan limits
    await verifyRecordLimit(workspace_id, 1);

    const result = await db.query(
      "INSERT INTO records (workspace_id, data, created_by) VALUES ($1, $2, $3) RETURNING *",
      [workspace_id, JSON.stringify(validatedData), userId]
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

  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "50", 10);
  const offset = (page - 1) * limit;

  try {
    // Verify user has read access to workspace
    await checkWorkspaceAccess(id, userId, userRole, "read");

    const recordsQuery = `
      SELECT * FROM records 
      WHERE workspace_id = $1 
      ORDER BY updated_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(recordsQuery, [id, limit, offset]);

    const countResult = await db.query(
      "SELECT COUNT(*) FROM records WHERE workspace_id = $1",
      [id]
    );
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    res.status(200).json({
      success: true,
      records: result.rows,
      totalRecords,
      totalPages,
      currentPage: page,
      limit
    });
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
    const record = await getRecordWithAccess(id, userId, userRole, "write");

    let validatedData = null;
    if (data) {
      validatedData = await validateRecordData(record.workspace_id, data);
    }

    const result = await db.query(
      "UPDATE records SET data = COALESCE($1, data), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [validatedData ? JSON.stringify(validatedData) : null, id]
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
