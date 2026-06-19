import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

  return children;
}

export default AdminProtectedRoute;