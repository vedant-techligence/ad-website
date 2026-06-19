import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Banned.css";

function Banned() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isBanned) return <Navigate to="/dashboard" replace />;

  return (
    <div className="banned-container">
      <div className="banned-card">
        <h2>Account Suspended</h2>
        <p className="banned-message">
          Your account has been banned from this platform.
        </p>
        {user.banReason && (
          <p className="banned-reason">
            <strong>Reason:</strong> {user.banReason}
          </p>
        )}
        <p className="banned-contact">
          If you believe this is a mistake, please contact the administrator.
        </p>
        <button className="banned-logout" onClick={logout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Banned;