import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import "./adminDashboard.css";

const STAT_LABELS = {
  totalCampaigns: "Total Campaigns",
  activeCampaigns: "Active Campaigns",
  pendingApprovals: "Pending Approvals",
  revenueGenerated: "Revenue Generated",
  activeRobots: "Active Robots",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/campaigns/admin/stats");
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return "N/A";
    if (key === "revenueGenerated") return `₹${value.toLocaleString("en-IN")}`;
    return value.toLocaleString("en-IN");
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h2 className="admin-dashboard__title">Admin Dashboard</h2>
          <p className="admin-dashboard__role">Role: {user?.role}</p>
        </div>
        <button className="admin-dashboard__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {loading && <p className="admin-dashboard__status">Loading stats...</p>}
      {error && <p className="admin-dashboard__error">{error}</p>}

      {stats && (
        <div className="admin-dashboard__grid">
          {Object.entries(STAT_LABELS).map(([key, label]) => (
            <div key={key} className="admin-dashboard__card">
              <p className="admin-dashboard__card-label">{label}</p>
              <h3 className="admin-dashboard__card-value">
                {formatValue(key, stats[key])}
              </h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;