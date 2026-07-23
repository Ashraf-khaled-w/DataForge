import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// GET /logs - Fetch global or team activity feed for dashboard
export const getDashboardLogs = async () => {
  const response = await axios.get(`${API_URL}/logs`);
  return response.data;
};

// GET /workspace/:workspaceId/logs - Fetch audit logs for a single workspace
export const getWorkspaceLogs = async (workspaceId) => {
  const response = await axios.get(`${API_URL}/workspace/${workspaceId}/logs`);
  return response.data;
};
