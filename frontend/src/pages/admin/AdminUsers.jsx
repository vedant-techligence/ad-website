import { useEffect, useState } from "react";
import API from "../../api/axios";
import CampaignDetailModal from "./CampaignDetailModal";
import "./adminUsers.css";
import "./adminCampaigns.css";
import "./campaignDetailModal.css";

const STATUS_OPTIONS = ["all", "active", "banned"];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [banReason, setBanReason] = useState("");
  const [banError, setBanError] = useState("");

  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetailLoading, setCampaignDetailLoading] = useState(false);
  const [campaignDetailError, setCampaignDetailError] = useState("");
  const [campaignActionError, setCampaignActionError] = useState("");

  const fetchUsers = async (q = search, s = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (q) params.search = q;
      if (s !== "all") params.status = s;
      const res = await API.get("/admin/users/all", { params });
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  }, []);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(search, statusFilter);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    fetchUsers(search, s);
  };

  const openDetail = async (id) => {
    setSelectedUserId(id);
    setSelectedUser(null);
    setDetailError("");
    setDetailLoading(true);
    setBanReason("");
    setBanError("");
    setCampaigns([]);

    try {
      const res = await API.get(`/admin/users/${id}`);
      setSelectedUser(res.data);
    } catch (err) {
      setDetailError(
        err.response?.data?.message || "Failed to fetch user details.",
      );
    } finally {
      setDetailLoading(false);
    }

    setCampaignsLoading(true);
    try {
      const res = await API.get(`/admin/users/${id}/campaigns`);
      setCampaigns(res.data);
    } catch {
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedUserId(null);
    setSelectedUser(null);
    setDetailError("");
  };

  const handleBan = async () => {
    setBanError("");
    try {
      const res = await API.patch(`/admin/users/${selectedUserId}/ban`, {
        reason: banReason,
      });
      setSelectedUser(res.data);
      setBanReason("");
      fetchUsers();
    } catch (err) {
      setBanError(err.response?.data?.message || "Failed to ban user.");
    }
  };

  const handleUnban = async () => {
    setBanError("");
    try {
      const res = await API.patch(`/admin/users/${selectedUserId}/unban`);
      setSelectedUser(res.data);
      fetchUsers();
    } catch (err) {
      setBanError(err.response?.data?.message || "Failed to unban user.");
    }
  };

  const openCampaignDetail = async (id) => {
    setSelectedCampaignId(id);
    setSelectedCampaign(null);
    setCampaignDetailError("");
    setCampaignDetailLoading(true);
    try {
      const res = await API.get(`/admin/campaigns/${id}`);
      setSelectedCampaign(res.data);
    } catch (err) {
      setCampaignDetailError(
        err.response?.data?.message || "Failed to fetch campaign details.",
      );
    } finally {
      setCampaignDetailLoading(false);
    }
  };

  const closeCampaignDetail = () => {
    setSelectedCampaignId(null);
    setSelectedCampaign(null);
    setCampaignDetailError("");
  };

  const handleCampaignAction = async (id, action) => {
    setCampaignActionError("");
    try {
      await API.patch(`/admin/campaigns/${id}/${action}`);
      const res = await API.get(`/admin/users/${selectedUserId}/campaigns`);
      setCampaigns(res.data);
      closeCampaignDetail();
    } catch (err) {
      setCampaignActionError(
        err.response?.data?.message || `Failed to ${action} campaign.`,
      );
    }
  };

  return (
    <div className="admin-users">
      <h2 className="admin-users__title">User Management</h2>

      <div className="admin-users__toolbar">
        <form className="admin-users__search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name, email or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-users__search-input"
          />
          <button type="submit" className="admin-users__search-btn">
            Search
          </button>
        </form>

        <div className="admin-users__filters">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={
                "admin-users__filter-btn" +
                (statusFilter === s ? " admin-users__filter-btn--active" : "")
              }
              onClick={() => handleStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="admin-campaigns__error">{error}</p>}
      {loading && <p className="admin-campaigns__status">Loading users...</p>}

      {!loading && !error && users.length === 0 && (
        <p className="admin-campaigns__status">No users found.</p>
      )}

      {!loading && users.length > 0 && (
        <div className="admin-campaigns__table-wrapper">
          <table className="admin-campaigns__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Business</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="admin-campaigns__row">
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.businessName || "—"}</td>
                  <td>
                    <span
                      className={`admin-users__badge admin-users__badge--${u.isBanned ? "banned" : "active"}`}
                    >
                      {u.isBanned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td className="admin-campaigns__actions">
                    <button
                      className="admin-campaigns__action-btn--view"
                      onClick={() => openDetail(u._id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUserId && (
        <div className="admin-user-modal__overlay" onClick={closeDetail}>
          <div
            className="admin-user-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="admin-user-modal__close" onClick={closeDetail}>
              ×
            </button>

            {detailLoading && (
              <p className="admin-campaigns__status">Loading details...</p>
            )}
            {detailError && (
              <p className="admin-campaigns__error">{detailError}</p>
            )}

            {selectedUser && !detailLoading && (
              <>
                <div className="admin-user-modal__header">
                  <h3 className="admin-user-modal__title">
                    {selectedUser.name}
                  </h3>
                  <span
                    className={`admin-users__badge admin-users__badge--${selectedUser.isBanned ? "banned" : "active"}`}
                  >
                    {selectedUser.isBanned ? "Banned" : "Active"}
                  </span>
                </div>

                <div className="admin-user-modal__section">
                  <h4>Details</h4>
                  <p>
                    <strong>Email:</strong> {selectedUser.email}
                  </p>
                  <p>
                    <strong>Business:</strong>{" "}
                    {selectedUser.businessName || "—"}
                  </p>
                  <p>
                    <strong>Industry:</strong> {selectedUser.industry || "—"}
                  </p>
                  <p>
                    <strong>Website:</strong> {selectedUser.website || "—"}
                  </p>
                  {selectedUser.isBanned && selectedUser.banReason && (
                    <p>
                      <strong>Ban Reason:</strong> {selectedUser.banReason}
                    </p>
                  )}
                </div>

                <div className="admin-user-modal__section">
                  <h4>Ban Control</h4>
                  {banError && (
                    <p className="admin-campaigns__error">{banError}</p>
                  )}
                  {selectedUser.isBanned ? (
                    <button
                      className="admin-user-modal__action-btn admin-user-modal__action-btn--unban"
                      onClick={handleUnban}
                    >
                      Unban User
                    </button>
                  ) : (
                    <div className="admin-user-modal__ban-form">
                      <textarea
                        placeholder="Reason for ban..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                      />
                      <button
                        className="admin-user-modal__action-btn admin-user-modal__action-btn--ban"
                        onClick={handleBan}
                      >
                        Ban User
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-user-modal__section">
                  <h4>Campaign History</h4>
                  {campaignActionError && (
                    <p className="admin-campaigns__error">
                      {campaignActionError}
                    </p>
                  )}
                  {campaignsLoading && (
                    <p className="admin-campaigns__status">
                      Loading campaigns...
                    </p>
                  )}
                  {!campaignsLoading && campaigns.length === 0 && (
                    <p className="admin-campaigns__status">
                      No campaigns found.
                    </p>
                  )}
                  {!campaignsLoading && campaigns.length > 0 && (
                    <div className="admin-campaigns__table-wrapper">
                      <table className="admin-campaigns__table">
                        <thead>
                          <tr>
                            <th>Title</th>
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
                              <td>
                                <span
                                  className={`admin-campaigns__badge admin-campaigns__badge--${c.status}`}
                                >
                                  {c.status.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td>
                                ₹{c.estimatedCost?.toLocaleString("en-IN") || 0}
                              </td>
                              <td>{formatDate(c.startDate)}</td>
                              <td>{formatDate(c.endDate)}</td>
                              <td className="admin-campaigns__actions">
                                <button
                                  className="admin-campaigns__action-btn--view"
                                  onClick={() => openCampaignDetail(c._id)}
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
              </>
            )}
          </div>
        </div>
      )}

      {selectedCampaignId && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          loading={campaignDetailLoading}
          error={campaignDetailError}
          onClose={closeCampaignDetail}
          onAction={(action) =>
            handleCampaignAction(selectedCampaign._id, action)
          }
        />
      )}
    </div>
  );
}

export default AdminUsers;