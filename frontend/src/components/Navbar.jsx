import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⬡</span>
        <span className="navbar-title">AD PLATFORM</span>
      </div>
      <div className="navbar-links">
        <Link
          to="/login"
          className={`navbar-link ${location.pathname === "/login" || location.pathname === "/" ? "active" : ""}`}
        >
          Login
        </Link>
        <Link
          to="/signup"
          className={`navbar-link-button ${location.pathname === "/signup" ? "active" : ""}`}
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;