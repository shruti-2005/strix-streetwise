import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/api";

const AuthContext = createContext(null);

function getOrCreateDeviceId() {
  let id = localStorage.getItem("strix_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("strix_device_id", id);
  }
  return id;
}

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
    try {
      if (token) {
        const { data } = await authApi.me();
        setUser(data.user);
      } else {
        const deviceId = getOrCreateDeviceId();
        const { data } = await authApi.anonymous(deviceId);
        persistSession(data.token, data.user);
      }
    } catch (err) {
      // Stale/invalid token - fall back to a fresh anonymous session
      localStorage.removeItem("strix_token");
      try {
        const deviceId = getOrCreateDeviceId();
        const { data } = await authApi.anonymous(deviceId);
        persistSession(data.token, data.user);
      } catch (innerErr) {
        setError("Could not reach Strix backend. Is it running on the expected port?");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
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
    await bootstrap(); // drops back to a fresh anonymous session
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
