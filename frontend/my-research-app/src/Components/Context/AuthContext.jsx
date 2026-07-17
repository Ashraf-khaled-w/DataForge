import { createContext, useContext, useState, useEffect } from "react";
import { getMe, loginUser, registerUser, logoutUser, guestLogin as guestLoginAPI } from "../../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getMe();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        // Not logged in or expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const guestLogin = async () => {
    try {
      const response = await guestLoginAPI();
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, guestLogin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
