import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Geo from "./pages/Geo";
import Profile from "./pages/Profile";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ProtectedRoute({ allowIncompleteProfile = false, children }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowIncompleteProfile && user && !user.isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowIncompleteProfile && user?.isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function HomeRedirect() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading-screen">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <Login />
            </PublicRoute>
          )}
        />
        <Route
          path="/signup"
          element={(
            <PublicRoute>
              <Signup />
            </PublicRoute>
          )}
        />
        <Route
          path="/onboarding"
          element={(
            <ProtectedRoute allowIncompleteProfile>
              <Onboarding />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/campaigns"
          element={(
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/analytics"
          element={(
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/reports"
          element={(
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/notifications"
          element={(
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/geo"
          element={(
            <ProtectedRoute>
              <Geo />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
