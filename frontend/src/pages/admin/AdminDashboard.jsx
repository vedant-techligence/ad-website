import { useEffect, useState } from "react";
import API from "../../api/axios";
import "./adminDashboard.css";
import "./adminCampaigns.css";
import CampaignDetailModal from "./CampaignDetailModal";
import "./campaignDetailModal.css";

const STAT_LABELS = {
  totalCampaigns: "Total Campaigns",
  activeCampaigns: "Active Campaigns",
  pendingApprovals: "Pending Approvals",
  revenueGenerated: "Revenue Generated",
  activeRobots: "Active Robots",
};

const STATUS_OPTIONS = [
  "all",
  "draft",
  "pending_payment",
  "paid_pending_verification",
  "public",
  "paused",
  "rejected",
  "completed",
  "cancelled",
];

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionError, setActionError] = useState("");

  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/campaigns/stats");
      setStats(res.data);
    } catch (err) {
      setStatsError(err.response?.data?.message || "Failed to fetch stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCampaigns = async (q = search, s = statusFilter) => {
    setCampaignsLoading(true);
    setCampaignsError("");
    try {
      const params = {};
      if (q) params.search = q;
      if (s !== "all") params.status = s;
      const res = await API.get("/admin/campaigns/all", { params });
      setCampaigns(res.data);
    } catch (err) {
      setCampaignsError(
        err.response?.data?.message || "Failed to fetch campaigns.",
      );
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStats();
      await fetchCampaigns();
    })();
  }, []);

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return "N/A";
    if (key === "revenueGenerated") return `₹${value.toLocaleString("en-IN")}`;
    return value.toLocaleString("en-IN");
  };

  const formatStatus = (s) => s.replace(/_/g, " ");
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns(search, statusFilter);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    fetchCampaigns(search, s);
  };

  const openDetail = async (id) => {
    setSelectedCampaignId(id);
    setSelectedCampaign(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await API.get(`/admin/campaigns/${id}`);
      setSelectedCampaign(res.data);
    } catch (err) {
      setDetailError(
        err.response?.data?.message || "Failed to fetch campaign details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCampaignId(null);
    setSelectedCampaign(null);
    setDetailError("");
  };

  const handleAction = async (id, action) => {
    setActionError("");
    try {
      await API.patch(`/admin/campaigns/${id}/${action}`);
      await Promise.all([fetchCampaigns(), fetchStats()]);
      if (selectedCampaignId === id) closeDetail();
    } catch (err) {
      setActionError(
        err.response?.data?.message || `Failed to ${action} campaign.`,
      );
    }
  };

  return (
    <div className="admin-dashboard">
      {statsLoading && (
        <p className="admin-dashboard__status">Loading stats...</p>
      )}
      {statsError && <p className="admin-dashboard__error">{statsError}</p>}
      {stats && (
        <div className="admin-dashboard__stats">
          <h2 className="admin-dashboard__stats-title">Overview</h2>
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

      <div className="admin-campaigns">
        <h2 className="admin-campaigns__title">Campaign Management</h2>

        <div className="admin-campaigns__toolbar">
          <form className="admin-campaigns__search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by title or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-campaigns__search-input"
            />
            <button type="submit" className="admin-campaigns__search-btn">
              Search
            </button>
          </form>

          <div className="admin-campaigns__filters">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={
                  "admin-campaigns__filter-btn" +
                  (statusFilter === s
                    ? " admin-campaigns__filter-btn--active"
                    : "")
                }
                onClick={() => handleStatusFilter(s)}
              >
                {formatStatus(s)}
              </button>
            ))}
          </div>
        </div>

        {actionError && <p className="admin-campaigns__error">{actionError}</p>}
        {campaignsError && (
          <p className="admin-campaigns__error">{campaignsError}</p>
        )}
        {campaignsLoading && (
          <p className="admin-campaigns__status">Loading campaigns...</p>
        )}

        {!campaignsLoading && !campaignsError && campaigns.length === 0 && (
          <p className="admin-campaigns__status">No campaigns found.</p>
        )}

        {!campaignsLoading && campaigns.length > 0 && (
          <div className="admin-campaigns__table-wrapper">
            <table className="admin-campaigns__table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Brand</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Cost</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} className="admin-campaigns__row">
                    <td>{c.title}</td>
                    <td>{c.brandName}</td>
                    <td>{c.owner?.email || "—"}</td>
                    <td>
                      <span
                        className={`admin-campaigns__badge admin-campaigns__badge--${c.status}`}
                      >
                        {formatStatus(c.status)}
                      </span>
                    </td>
                    <td>₹{c.estimatedCost?.toLocaleString("en-IN") || 0}</td>
                    <td>{formatDate(c.startDate)}</td>
                    <td>{formatDate(c.endDate)}</td>
                    <td className="admin-campaigns__actions">
                      <button
                        className="admin-campaigns__action-btn admin-campaigns__action-btn--view"
                        onClick={() => openDetail(c._id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCampaignId && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          loading={detailLoading}
          error={detailError}
          onClose={closeDetail}
          onAction={(action) => handleAction(selectedCampaign._id, action)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
