import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../lib/axiosInstance';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]               = useState(true); // true on first mount

  // ── Session Persistence ────────────────────────────────────────────────────
  // Called on every page load/refresh.
  // Hits GET /api/auth/me → if the HttpOnly cookie is valid, user stays logged in.
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/auth/me');
      setUser(data.data.user);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for 401 events dispatched by the axios interceptor
    // (e.g. token expired mid-session)
    const handleExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [checkAuth]);

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Called after login/verify-otp API success: pass the user object from response */
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  /** Calls logout API (clears HttpOnly cookie server-side), then clears local state */
  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Even if API fails, clear client state
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /** Merge partial updates into user (e.g. after profile edit) */
  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
