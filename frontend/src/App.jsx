import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import Billing from "./pages/Billing";

// Feature pages (Anshul & Yash's work)
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Geo from "./pages/Geo";
import Profile from "./pages/Profile";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminRobots from "./pages/admin/AdminRobots";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Public route — redirect already-logged-in users away from login/signup
function PublicRoute({ children }) {
  const { token, user, loading } = useAuth();
  if (loading) return <div className="app-loading-screen">Loading...</div>;
  if (token)
    return (
      <Navigate
        to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"}
        replace
      />
    );
  return children;
}

// Protected route — requires login + completed onboarding
function ProtectedRoute({ allowIncompleteProfile = false, children }) {
  const { token, user, loading } = useAuth();
  if (loading) return <div className="app-loading-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (!allowIncompleteProfile && user && !user.isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

// Admin guard
function AdminRoute({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return <div className="app-loading-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

// Layout wrapper — admin routes render their own chrome via AdminLayout
function SiteLayout({ children }) {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");
  if (isAdminRoute) return children;
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteLayout>
        <Routes>
          {/* ── Public ── */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── User protected ── */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowIncompleteProfile>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/geo"
            element={
              <ProtectedRoute>
                <Geo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ── Admin ── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="campaigns" element={<AdminCampaigns />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="robots" element={<AdminRobots />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </SiteLayout>
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
