import { createContext, useContext, useState } from "react";

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
