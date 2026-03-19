import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useState } from "react";

import Navbar           from "./components/Navbar";
import Sidebar          from "./components/Sidebar";

import LandingPage      from "./pages/LandingPage";
import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import UnifiedCalendar  from "./pages/UnifiedCalendar";
import CreateEvent      from "./pages/CreateEvent";
import ConflictResult   from "./pages/ConflictResult";
import EventsPage       from "./pages/EventsPage";
import ManageEvents     from "./pages/ManageEvents";
import AcademicSchedule from "./pages/AcademicSchedule";
import NotificationsPage from "./pages/NotificationsPage";
import UserProfile      from "./pages/UserProfile";
import NotFoundPage     from "./pages/NotFoundPage";

import "./App.css";

function ProtectedRoute({ children, roles }) {
  const { user, loadingContext } = useAuth();
  
  // Wait for JWT validation before booting user out
  if (loadingContext) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--primary, #2563EB)', fontWeight: 'bold' }}>Validating Session...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === "admin" ? "/admin" : user.role === "organizer" ? "/organizer-dashboard" : "/dashboard";
    return <Navigate to={home} replace />;
  }
  return children;
}

function AppLayout() {
  const { user, loadingContext } = useAuth();
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAuth = !!user;

  return (
    <>
      <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
      {isAuth && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      )}
      <main className={`${isAuth ? "app-main-with-sidebar" : "app-main"} ${isAuth && sidebarCollapsed ? "app-main-collapsed" : ""}`}>
        <Routes>
          {/* Public */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={
                    user.role === "admin" ? "/admin"
                    : user.role === "organizer" ? "/organizer-dashboard"
                    : "/dashboard"
                  } replace />
              ) : <LandingPage />
            } 
          />
          <Route
            path="/login"
            element={
              loadingContext ? (
                <div className="auth-page">
                  <div className="auth-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <span style={{ fontSize: '1.5rem', color: 'var(--primary, #2563EB)', fontWeight: 'bold' }}>Loading...</span>
                  </div>
                </div>
              ) : user ? (
                <Navigate to={
                    user.role === "admin" ? "/admin"
                    : user.role === "organizer" ? "/organizer-dashboard"
                    : "/dashboard"
                  } replace />
              ) : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              loadingContext ? (
                <div className="auth-page">
                  <div className="auth-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <span style={{ fontSize: '1.5rem', color: 'var(--primary, #2563EB)', fontWeight: 'bold' }}>Loading...</span>
                  </div>
                </div>
              ) : user ? (
                <Navigate to={
                    user.role === "admin" ? "/admin"
                    : user.role === "organizer" ? "/organizer-dashboard"
                    : "/dashboard"
                  } replace />
              ) : <RegisterPage />
            }
          />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />

          {/* Organizer */}
          <Route path="/organizer-dashboard" element={<ProtectedRoute roles={["organizer"]}><OrganizerDashboard /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"         element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/manage-events" element={<ProtectedRoute roles={["admin"]}><ManageEvents /></ProtectedRoute>} />
          <Route path="/schedule"      element={<ProtectedRoute roles={["admin", "organizer"]}><AcademicSchedule /></ProtectedRoute>} />

          {/* Shared (all authenticated) */}
          <Route path="/calendar"      element={<ProtectedRoute><UnifiedCalendar /></ProtectedRoute>} />
          <Route path="/events"        element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/create-event"  element={<ProtectedRoute roles={["admin", "organizer"]}><CreateEvent /></ProtectedRoute>} />
          <Route path="/conflict"      element={<ProtectedRoute roles={["admin", "organizer"]}><ConflictResult /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile"       element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
