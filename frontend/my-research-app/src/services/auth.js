import axios from "axios";

const URL = "http://localhost:3000";

// POST /login - Authenticate user
export const loginUser = async (email, password) => {
  const response = await axios.post(`${URL}/login`, { email, password });
  return response.data;
};

// POST /register - Register user with plan selection
export const registerUser = async (userData) => {
  const response = await axios.post(`${URL}/register`, userData);
  return response.data;
};

// POST /logout - Clear session cookie
export const logoutUser = async () => {
  const response = await axios.post(`${URL}/logout`);
  return response.data;
};

// GET /me - Check current authentication session
export const getMe = async () => {
  const response = await axios.get(`${URL}/me`);
  return response.data;
};

// POST /auth/guest - Log in as a trial guest account
export const guestLogin = async () => {
  const response = await axios.post(`${URL}/auth/guest`);
  return response.data;
};
