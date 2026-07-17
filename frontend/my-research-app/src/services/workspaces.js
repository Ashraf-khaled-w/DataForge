import axios from "axios";

const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// GET /workspaces - Get all workspaces
export const getWorkspaces = async () => {
  const response = await axios.get(`${URL}/workspaces`);
  return response.data;
};

// POST /workspaces - Create a new workspace
export const createWorkspace = async (workspace) => {
  const response = await axios.post(`${URL}/workspaces`, workspace);
  return response.data;
};

// GET /workspace/:id - Get a specific workspace
export const getWorkspace = async (id) => {
  const response = await axios.get(`${URL}/workspace/${id}`);
  return response.data;
};

// PATCH /workspace/:id - Update workspace details
export const updateWorkspace = async (id, workspaceData) => {
  const response = await axios.patch(`${URL}/workspace/${id}`, workspaceData);
  return response.data;
};

// PATCH /workspace/:id/config - Update columns config
export const updateWorkspaceConfig = async (id, config) => {
  const response = await axios.patch(`${URL}/workspace/${id}/config`, { config });
  return response.data;
};

// DELETE /workspace/:id - Delete a workspace
export const deleteWorkspace = async (id) => {
  const response = await axios.delete(`${URL}/workspace/${id}`);
  return response.data;
};
