import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useState } from "react";

import Navbar           from "./components/Navbar";
import Sidebar          from "./components/Sidebar";

import LandingPage      from "./pages/LandingPage";
import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
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
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const home = user.role === "admin" ? "/admin" : user.role === "faculty" ? "/faculty-dashboard" : "/dashboard";
    return <Navigate to={home} replace />;
  }
  return children;
}

function AppLayout() {
  const { user } = useAuth();
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
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              user
                ? <Navigate to={
                    user.role === "admin" ? "/admin"
                    : user.role === "faculty" ? "/faculty-dashboard"
                    : "/dashboard"
                  } replace />
                : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              user
                ? <Navigate to={
                    user.role === "admin" ? "/admin"
                    : user.role === "faculty" ? "/faculty-dashboard"
                    : "/dashboard"
                  } replace />
                : <RegisterPage />
            }
          />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />

          {/* Faculty */}
          <Route path="/faculty-dashboard" element={<ProtectedRoute roles={["faculty"]}><FacultyDashboard /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"         element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/manage-events" element={<ProtectedRoute roles={["admin"]}><ManageEvents /></ProtectedRoute>} />
          <Route path="/schedule"      element={<ProtectedRoute roles={["admin", "faculty"]}><AcademicSchedule /></ProtectedRoute>} />

          {/* Shared (all authenticated) */}
          <Route path="/calendar"      element={<ProtectedRoute><UnifiedCalendar /></ProtectedRoute>} />
          <Route path="/events"        element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/create-event"  element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/conflict"      element={<ProtectedRoute><ConflictResult /></ProtectedRoute>} />
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
