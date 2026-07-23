import db from "../config/db.js";

// Helper function to insert an activity log into the database
export const createActivityLog = async (workspaceId, userId, action, details) => {
  try {
    await db.query(
      "INSERT INTO activity_logs (workspace_id, user_id, action, details) VALUES ($1, $2, $3, $4)",
      [workspaceId, userId, action, details]
    );
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
};
