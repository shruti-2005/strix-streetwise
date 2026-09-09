import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistSession = (token, user) => {
    localStorage.setItem("strix_token", token);
    setUser(user);
  };

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("strix_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      // A stale or invalid session should take the user back to sign-in.
      localStorage.removeItem("strix_token");
      setUser(null);
      setError("Your session has expired. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password, portal = "citizen") => {
    const { data } = await authApi.login({ email, password, portal });
    persistSession(data.token, data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    persistSession(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    localStorage.removeItem("strix_token");
    setUser(null);
  };

  const updateWatchedLocality = async (watchedLocality) => {
    const { data } = await authApi.updateMe({ watchedLocality });
    setUser(data.user);
  };

  const isAuthority = user?.role === "authority" || user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, updateWatchedLocality, isAuthority, refresh: bootstrap }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
