import bcrypt from "bcryptjs";
import db from "../config/db.js";

export const getUsers = async (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let result;
    if (userRole === "admin") {
      result = await db.query("SELECT id, full_name, email, role, manager_id, created_at FROM users ORDER BY created_at DESC");
    } else if (userRole === "team_leader") {
      // Team leader sees themselves and users they manage
      result = await db.query(
        "SELECT id, full_name, email, role, manager_id, created_at FROM users WHERE manager_id = $1 OR id = $1 ORDER BY created_at DESC",
        [userId]
      );
    } else {
      // Standard user can only see themselves
      result = await db.query(
        "SELECT id, full_name, email, role, manager_id, created_at FROM users WHERE id = $1",
        [userId]
      );
    }
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await db.query(
      "SELECT id, full_name, email, role, manager_id, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: "المستخدم غير موجود." } });
    }

    const user = result.rows[0];

    // Access check
    if (userRole !== "admin" && user.id !== userId && user.manager_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: "غير مسموح لك باستعراض بيانات هذا المستخدم." }
      });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  const { full_name, email, password, role, manager_id } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: "الاسم البريد ورقم المرور مطلوبة." }
    });
  }

  try {
    // Check if email exists
    const emailCheck = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: "البريد الإلكتروني مسجل بالفعل." }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role || "user";
    const result = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role, manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, manager_id, created_at",
      [full_name, email, passwordHash, userRole, manager_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const updates = req.body;

  try {
    const userCheck = await db.query("SELECT id, manager_id FROM users WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: "المستخدم غير موجود." } });
    }

    const targetUser = userCheck.rows[0];

    // Access check: Admin can update anyone. Others can update themselves. Team leader can update users they manage.
    if (userRole !== "admin" && targetUser.id !== userId && targetUser.manager_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: "غير مسموح لك بتعديل بيانات هذا المستخدم." }
      });
    }

    // Standard user and team leader cannot change their own role to admin
    if (userRole !== "admin" && updates.role && updates.role !== targetUser.role) {
      return res.status(403).json({
        success: false,
        error: { message: "غير مسموح لك بتغيير الصلاحيات." }
      });
    }

    const queryParts = [];
    const values = [];

    for (const key of Object.keys(updates)) {
      if (key !== "id") {
        if (key === "password") {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(updates[key], salt);
          queryParts.push(`password_hash = $${values.length + 1}`);
          values.push(passwordHash);
        } else if (key === "password_hash") {
          // Skip raw hash assignment, force using "password" for hashing
          continue;
        } else {
          queryParts.push(`${key} = $${values.length + 1}`);
          values.push(updates[key]);
        }
      }
    }

    if (values.length === 0) {
      return res.status(400).json({ success: false, error: { message: "لا توجد بيانات للتحديث." } });
    }

    values.push(id);
    const query = `UPDATE users SET ${queryParts.join(", ")} WHERE id = $${values.length} RETURNING id, full_name, email, role, manager_id, created_at`;
    const result = await db.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const userCheck = await db.query("SELECT id, manager_id FROM users WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: "المستخدم غير موجود." } });
    }

    const targetUser = userCheck.rows[0];

    // Access check: Admin can delete anyone. Team leader can delete users they manage.
    if (userRole !== "admin" && targetUser.manager_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: "غير مسموح لك بحذف هذا المستخدم." }
      });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({
        success: false,
        error: { message: "لا يمكنك حذف حسابك بنفسك من هنا." }
      });
    }

    const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING id, full_name, email, role, manager_id, created_at", [id]);

    res.status(200).json({
      success: true,
      message: "تم حذف المستخدم بنجاح",
      deleted: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
