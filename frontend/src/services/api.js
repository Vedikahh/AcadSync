const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AI_CONFLICT_ASSIST_ENABLED = String(import.meta.env.VITE_ENABLE_AI_CONFLICT_ASSIST || "").toLowerCase() === "true";

export const isAiConflictAssistEnabled = () => AI_CONFLICT_ASSIST_ENABLED;

async function request(path, options = {}) {
  const token = localStorage.getItem("acadsync_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const rawText = await res.text();
    let data = {};

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = {};
    }
    
    if (!res.ok) {
      const fallback = rawText && !rawText.trim().startsWith("<!DOCTYPE")
        ? rawText.trim()
        : `${res.status} ${res.statusText}`;
      throw new Error(data.message || fallback || "Request failed");
    }
    
    return data;
  } catch (error) {
    // If we fail to fetch (e.g server down), throw a clear error
    if (error.message === "Failed to fetch") {
      throw new Error("Cannot connect to server. Please ensure backend is running.");
    }
    throw error;
  }
}

// ---- Authentication APIs ----
export const login = (credentials) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const googleLogin = (token) =>
  request("/api/auth/google", { method: "POST", body: JSON.stringify({ token }) });

export const googleRegister = (payload) =>
  request("/api/auth/google-register", { method: "POST", body: JSON.stringify(payload) });

export const register = (payload) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });

export const getMe = () => 
  request("/api/auth/me", { method: "GET" });

export const forgotPassword = (email) =>
  request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token, password) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const verifyEmail = (token) =>
  request(`/api/auth/verify-email/${encodeURIComponent(token)}`, {
    method: "GET",
  });

export const verifyEmailOtp = (email, otp) =>
  request("/api/auth/verify-email/otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

export const requestEmailVerification = (email) =>
  request("/api/auth/verify-email/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

// ---- Event APIs ----
export const getEvents = () => request("/api/events");
export const getMyEvents = () => request("/api/events/my-events");

export const checkEventConflicts = (event) =>
  request("/api/events/check-conflicts", { method: "POST", body: JSON.stringify(event) });

export const createEvent = (event) =>
  request("/api/events", { method: "POST", body: JSON.stringify(event) });

export const updateEvent = (id, event) =>
  request(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(event) });

export const updateEventStatus = (id, status, payload = {}) => {
  // Routes mapped to our Node.js design
  const path = status === 'approved' ? `/api/events/${id}/approve` : `/api/events/${id}/reject`;
  const hasPayload = payload && Object.keys(payload).length > 0;
  return request(path, {
    method: "PATCH",
    ...(hasPayload ? { body: JSON.stringify(payload) } : {}),
  });
}

export const deleteEvent = (id) =>
  request(`/api/events/${id}`, { method: "DELETE" });

// ---- Schedule APIs ----
export const getSchedules = () => request("/api/schedule");

export const createSchedule = (schedule) =>
  request("/api/schedule", { method: "POST", body: JSON.stringify(schedule) });

export const updateSchedule = (id, schedule) =>
  request(`/api/schedule/${id}`, { method: "PUT", body: JSON.stringify(schedule) });

export const deleteSchedule = (id) =>
  request(`/api/schedule/${id}`, { method: "DELETE" });

export const importSchedules = (rows, mode = "replace", dryRun = false) =>
  request("/api/schedule/import", {
    method: "POST",
    body: JSON.stringify({ rows, mode, dryRun }),
  });

export const getScheduleImportHistory = () =>
  request("/api/schedule/import/history", { method: "GET" });

export const rollbackScheduleImport = (versionId) =>
  request(`/api/schedule/import/rollback/${versionId}`, {
    method: "POST",
  });

// ---- Notification APIs ----
export const getNotifications = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/notifications${suffix}`);
};

export const markNotificationRead = (id) =>
  request(`/api/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  request("/api/notifications/read-all", { method: "PATCH" });

// ---- User APIs ----
export const updateUserProfile = (data) =>
  request("/api/users/update", { method: "PUT", body: JSON.stringify(data) });

export const getPublicUserProfile = (userId) =>
  request(`/api/users/public/${encodeURIComponent(userId)}`, { method: "GET" });

export const changeUserPassword = (data) =>
  request("/api/users/change-password", { method: "POST", body: JSON.stringify(data) });

export const deleteUserAccount = (data) =>
  request("/api/users/delete-account", { method: "DELETE", body: JSON.stringify(data) });

// ---- Dashboard APIs (Currently placeholder map) ----
export const getDashboardStats = () => request("/api/dashboard/stats");

export const getAuditLogs = (params = {}) => {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.action) query.set("action", String(params.action));
  if (params.entityType) query.set("entityType", String(params.entityType));
  if (params.actorId) query.set("actorId", String(params.actorId));
  if (params.from) query.set("from", String(params.from));
  if (params.to) query.set("to", String(params.to));
  if (params.search) query.set("search", String(params.search));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/dashboard/audit-logs${suffix}`, { method: "GET" });
};

