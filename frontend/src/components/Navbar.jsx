import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "DASHBOARD", to: "/dashboard" },
  { label: "CAMPAIGNS", to: "/campaigns" },
  { label: "ANALYTICS", to: "/analytics" },
  { label: "AUDIENCE", to: "/audience" },
  { label: "BILLING", to: "/billing" },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        {/* Brand */}
        <div className="navbar-brand">
          <img
            src="https://www.techligence.in/logo.png"
            alt="Techligence"
            className="navbar-logo-img"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <span className="navbar-title">TECHLIGENCE</span>
        </div>

        {/* Nav links — only when logged in */}
        {isLoggedIn && (
          <div className="navbar-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-link ${location.pathname === link.to ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right actions */}
        <div className="navbar-actions">
          {isLoggedIn ? (
            <button className="navbar-cta-button" onClick={handleLogout}>
              LOGOUT
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className={`navbar-link ${location.pathname === "/login" || location.pathname === "/" ? "active" : ""}`}
              >
                LOGIN
              </Link>
              <Link to="/signup" className="navbar-cta-button">
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
