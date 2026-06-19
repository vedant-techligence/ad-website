import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import AdminNavbar from "../../components/AdminNavbar";

function AdminLayout() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
