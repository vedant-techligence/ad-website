import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./AdminNavbar.css";

const ADMIN_NAV_LINKS = [
  { label: "DASHBOARD", to: "/admin/dashboard" },
  { label: "USERS", to: "/admin/users" },
];

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-brand">
          <img
            src="https://www.techligence.in/logo.png"
            alt="Techligence"
            className="navbar-logo-img"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <span className="navbar-title">TECHLIGENCE</span>
          <span className="navbar-admin-badge">ADMIN</span>
        </div>

        <div className="navbar-links">
          {ADMIN_NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${location.pathname === link.to ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <span className="navbar-user-email">{user?.email}</span>
          <button className="navbar-cta-button" onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      </nav>
    </div>
  );
}

export default AdminNavbar;