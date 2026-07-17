import axios from "axios";

const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// GET /users - Retrieve all users
export const getUsers = async () => {
  const response = await axios.get(`${URL}/users`);
  return response.data;
};

// GET /user/:id - Retrieve a specific user
export const getUser = async (id) => {
  const response = await axios.get(`${URL}/user/${id}`);
  return response.data;
};

// POST /users - Register a new user
export const createUser = async (userData) => {
  const response = await axios.post(`${URL}/users`, userData);
  return response.data;
};

export const registerUser = createUser; // Alias for flexibility

// PATCH /user/:id - Update user profile
export const updateUser = async (id, userData) => {
  const response = await axios.patch(`${URL}/user/${id}`, userData);
  return response.data;
};

// DELETE /user/:id - Delete a user
export const deleteUser = async (id) => {
  const response = await axios.delete(`${URL}/user/${id}`);
  return response.data;
};
