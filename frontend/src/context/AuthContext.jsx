import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/api";

const AuthContext = createContext(null);

function getStoredUser() {
  const stored = localStorage.getItem("acadsync_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
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
        
        // Update user payload dynamically (e.g if name changed)
        setUser(userData);
        localStorage.setItem("acadsync_user", JSON.stringify(userData));
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
    setUser(userData);
    localStorage.setItem("acadsync_user", JSON.stringify(userData));
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
