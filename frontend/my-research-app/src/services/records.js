import axios from "axios";

const URL = "http://localhost:3000";

// GET /records - Get all records
export const getRecords = async () => {
  const response = await axios.get(`${URL}/records`);
  return response.data;
};

// POST /records - Create a single record
export const addRecord = async (record) => {
  const response = await axios.post(`${URL}/records`, record);
  return response.data;
};

// GET /records/workspace/:id - Get records for a workspace
export const getRecordsByWorkspaceId = async (workspaceId) => {
  const response = await axios.get(`${URL}/records/workspace/${workspaceId}`);
  return response.data;
};

// GET /record/:id - Get a single record
export const getRecord = async (id) => {
  const response = await axios.get(`${URL}/record/${id}`);
  return response.data;
};

// PATCH /record/:id - Update specific record
export const updateRecord = async (id, updatedData) => {
  const response = await axios.patch(`${URL}/record/${id}`, updatedData);
  return response.data;
};

// DELETE /record/:id - Delete a record
export const deleteRecord = async (id) => {
  const response = await axios.delete(`${URL}/record/${id}`);
  return response.data;
};

// POST /workspace/:id/upload - Upload excel/csv bulk file
export const uploadRecordsFile = async (workspaceId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${URL}/workspace/${workspaceId}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
