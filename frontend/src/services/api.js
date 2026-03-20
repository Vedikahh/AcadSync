const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

// ---- Event APIs ----
export const getEvents = () => request("/api/events");

export const checkEventConflicts = (event) =>
  request("/api/events/check-conflicts", { method: "POST", body: JSON.stringify(event) });

export const createEvent = (event) =>
  request("/api/events", { method: "POST", body: JSON.stringify(event) });

export const updateEvent = (id, event) =>
  request(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(event) });

export const updateEventStatus = (id, status) => {
  // Routes mapped to our Node.js design
  const path = status === 'approved' ? `/api/events/${id}/approve` : `/api/events/${id}/reject`;
  return request(path, { method: "PATCH" });
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

export const importSchedules = (rows, mode = "replace") =>
  request("/api/schedule/import", {
    method: "POST",
    body: JSON.stringify({ rows, mode }),
  });

// ---- Notification APIs ----
export const getNotifications = () => request("/api/notifications");

export const markNotificationRead = (id) =>
  request(`/api/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  request("/api/notifications/read-all", { method: "PATCH" });

// ---- User APIs ----
export const updateUserProfile = (data) =>
  request("/api/users/update", { method: "PUT", body: JSON.stringify(data) });

// ---- Dashboard APIs (Currently placeholder map) ----
export const getDashboardStats = () => request("/api/dashboard/stats");

