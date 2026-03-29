import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/api";

const AuthContext = createContext(null);

const DEFAULT_NOTIFICATION_CHANNELS = {
  event: { inApp: true, email: true },
  approval: { inApp: true, email: true },
  rejection: { inApp: true, email: true },
  reminder: { inApp: true, email: true },
};

const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const inferOnboardingCompleted = (payload = {}) => {
  if (typeof payload.onboardingCompleted === "boolean") return payload.onboardingCompleted;
  return hasText(payload.department) && hasText(payload.year);
};

function normalizeUserPayload(payload) {
  if (!payload) return null;

  const legacyNotification = payload.notificationPreferences || {};
  const legacyEmail = payload.emailPreferences || {};
  const emailEnabled = legacyEmail.enabled !== false;
  const channels = payload.notificationChannels || {};

  const notificationChannels = {
    event: {
      inApp: typeof channels.event?.inApp === "boolean" ? channels.event.inApp : legacyNotification.event !== false,
      email: typeof channels.event?.email === "boolean" ? channels.event.email : (emailEnabled && legacyEmail.event !== false),
    },
    approval: {
      inApp: typeof channels.approval?.inApp === "boolean" ? channels.approval.inApp : legacyNotification.approval !== false,
      email: typeof channels.approval?.email === "boolean" ? channels.approval.email : (emailEnabled && legacyEmail.approval !== false),
    },
    rejection: {
      inApp: typeof channels.rejection?.inApp === "boolean" ? channels.rejection.inApp : legacyNotification.rejection !== false,
      email: typeof channels.rejection?.email === "boolean" ? channels.rejection.email : (emailEnabled && legacyEmail.rejection !== false),
    },
    reminder: {
      inApp: typeof channels.reminder?.inApp === "boolean" ? channels.reminder.inApp : legacyNotification.reminder !== false,
      email: typeof channels.reminder?.email === "boolean" ? channels.reminder.email : (emailEnabled && legacyEmail.reminder !== false),
    },
  };

  return {
    ...payload,
    id: payload.id || payload._id,
    avatar: payload.avatar || "",
    bio: payload.bio || "",
    year: payload.year || "",
    interests: Array.isArray(payload.interests) ? payload.interests : [],
    phone: payload.phone || "",
    alternateContact: payload.alternateContact || "",
    onboardingCompleted: inferOnboardingCompleted(payload),
    notificationChannels: { ...DEFAULT_NOTIFICATION_CHANNELS, ...notificationChannels },
  };
}

function getStoredUser() {
  const stored = localStorage.getItem("acadsync_user");
  if (!stored) return null;
  try {
    return normalizeUserPayload(JSON.parse(stored));
  } catch {
    localStorage.removeItem("acadsync_user");
    return null;
  }
}

function getStoredToken() {
  return localStorage.getItem("acadsync_token");
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loadingContext, setLoadingContext] = useState(true);

  // Validate the session on initial active load
  useEffect(() => {
    const validateSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoadingContext(false);
        return;
      }

      try {
        // Ping our secure /api/auth/me endpoint using the stored JWT
        const userData = await getMe();
        const normalized = normalizeUserPayload(userData);
        
        // Update user payload dynamically (e.g if name changed)
        setUser(normalized);
        localStorage.setItem("acadsync_user", JSON.stringify(normalized));
      } catch (err) {
        console.error("Session validation failed:", err.message);
        // If token is expired/invalid, force logout
        logout();
      } finally {
        setLoadingContext(false);
      }
    };

    validateSession();
  }, []);

  const login = (userData, token) => {
    const normalized = normalizeUserPayload(userData);
    setUser(normalized);
    localStorage.setItem("acadsync_user", JSON.stringify(normalized));
    if (token) localStorage.setItem("acadsync_token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("acadsync_user");
    localStorage.removeItem("acadsync_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loadingContext }}>
      {children}
    </AuthContext.Provider>
  );
}
