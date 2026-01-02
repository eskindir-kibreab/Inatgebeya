import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../api/auth.api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        const userRole = response.data.role?.role_name || response.data.role_name || "user";
        setUser(response.data);
        setRole(userRole);
      }
    } catch (error) {
      sessionStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success) {
        sessionStorage.setItem("token", response.data.token);
        const userRole = response.data.user.role?.role_name || response.data.user.role_name || "user";
        setUser(response.data.user);
        setRole(userRole);
        toast.success("Login successful!");
        return { success: true, role: userRole };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        toast.success("Registration successful! Please login.");
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const logout = async (message = "Logged out successfully") => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      sessionStorage.removeItem("token");
      setUser(null);
      setRole(null);
      toast.success(message);
      // Force reload to clear all states and redirect to home
      window.location.href = "/";
    }
  };

  const value = {
    user,
    role,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
