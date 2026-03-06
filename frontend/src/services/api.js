const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token = localStorage.getItem("acadsync_token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// Auth
export const login = (credentials) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const register = (payload) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });

// Events
export const getEvents = () => request("/api/events");
export const createEvent = (event) =>
  request("/api/events", { method: "POST", body: JSON.stringify(event) });
export const updateEventStatus = (id, status) =>
  request(`/api/events/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteEvent = (id) =>
  request(`/api/events/${id}`, { method: "DELETE" });

// Notifications
export const getNotifications = () => request("/api/notifications");
export const markNotificationRead = (id) =>
  request(`/api/notifications/${id}/read`, { method: "PATCH" });
export const markAllNotificationsRead = () =>
  request("/api/notifications/read-all", { method: "PATCH" });

// Dashboard stats
export const getDashboardStats = () => request("/api/dashboard/stats");
