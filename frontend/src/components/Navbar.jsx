import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">⬡</span>
        <span className="navbar-title">AD PLATFORM</span>
      </div>
      <div className="navbar-links">
        {isLoggedIn ? (
          <button className="navbar-logout-button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
