import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("strix_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.method?.toLowerCase() === "get") {
    config.headers["Cache-Control"] = "no-cache";
    config.headers.Pragma = "no-cache";
  }
  return config;
});

export const UPLOADS_BASE_URL = API_BASE_URL;

// ---------- Auth ----------
export const authApi = {
  anonymous: (deviceId) => api.post("/auth/anonymous", { deviceId }),
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  updateMe: (payload) => api.patch("/auth/me", payload),
};

// ---------- Issues ----------
export const issuesApi = {
  list: (params) => api.get("/issues", { params }),
  nearby: (params) => api.get("/issues/nearby", { params }),
  mine: () => api.get("/issues/mine"),
  getById: (id) => api.get(`/issues/${id}`),
  create: (formData) =>
    api.post("/issues", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  upvote: (id) => api.post(`/issues/${id}/upvote`),
  dashboard: () => api.get("/issues/dashboard"),
};

// ---------- Authority ----------
export const authorityApi = {
  queue: (params) => api.get("/authority/queue", { params }),
  analytics: () => api.get("/authority/analytics"),
  verify: (id, payload) => api.patch(`/authority/issues/${id}/verify`, payload),
  assign: (id, payload) => api.patch(`/authority/issues/${id}/assign`, payload),
  updateStatus: (id, payload) => api.patch(`/authority/issues/${id}/status`, payload),
};
