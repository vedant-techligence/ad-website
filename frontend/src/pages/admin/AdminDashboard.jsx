import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import "./adminDashboard.css";

const STAT_LABELS = {
  totalCampaigns: "Total Campaigns",
  activeCampaigns: "Active Campaigns",
  pendingApprovals: "Pending Approvals",
  revenueGenerated: "Revenue Generated",
  activeRobots: "Active Robots",
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get("/admin/campaigns/stats");
      setStats(res.data);
    } catch (err) {
      setStatsError(err.response?.data?.message || "Failed to fetch stats.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return "N/A";
    if (key === "revenueGenerated") return `₹${value.toLocaleString("en-IN")}`;
    return value.toLocaleString("en-IN");
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__welcome">
        <h2 className="admin-dashboard__welcome-title">Dashboard Home</h2>
        <p className="admin-dashboard__welcome-text">
          A quick snapshot of platform activity. Use the links below to jump
          into campaign or user management.
        </p>
      </div>

      {statsLoading && (
        <p className="admin-dashboard__status">Loading stats...</p>
      )}
      {statsError && <p className="admin-dashboard__error">{statsError}</p>}
      {stats && (
        <div className="admin-dashboard__stats">
          <h3 className="admin-dashboard__stats-title">Overview</h3>
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
        </div>
      )}

      <div className="admin-dashboard__links">
        <Link to="/admin/campaigns" className="admin-dashboard__link-card">
          <h4>Campaign Management</h4>
          <p>Review, approve, reject, or pause advertiser campaigns.</p>
        </Link>
        <Link to="/admin/users" className="admin-dashboard__link-card">
          <h4>User Management</h4>
          <p>View users, ban or unban accounts, check campaign history.</p>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
