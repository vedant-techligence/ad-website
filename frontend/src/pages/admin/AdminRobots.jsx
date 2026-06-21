import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./AdminRobots.css";
import api from "../../api/axios";

const STATUS_COLORS = {
  online: { bg: "rgba(0,168,204,0.12)", color: "#005570" },
  offline: { bg: "rgba(100,100,120,0.12)", color: "#444" },
  maintenance: { bg: "rgba(198,126,16,0.12)", color: "#8a4f08" },
};

const STATUS_LABELS = {
  online: "Online",
  offline: "Offline",
  maintenance: "Maintenance",
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const EMPTY_FORM = {
  name: "",
  serialNumber: "",
  status: "offline",
  "location.label": "",
  "location.city": "",
  "location.latitude": "",
  "location.longitude": "",
  notes: "",
};

function AdminRobots() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [robots, setRobots] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [authLoading, user, navigate]);

  const fetchSummary = async () => {
    try {
      const res = await api.get("/admin/robots/summary");
      setSummary(res.data.data);
    } catch {
      // non-critical
    }
  };

  const fetchRobots = async (status, city) => {
    setLoading(true);
    setPageError("");
    try {
      const params = {};
      if (status) params.status = status;
      if (city) params.city = city;
      const res = await api.get("/admin/robots", { params });
      setRobots(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 403) {
        setPageError("Admin access required.");
        return;
      }
      setPageError("Failed to load robots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;
    fetchSummary();
    fetchRobots("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    fetchRobots(status, cityFilter);
  };

  const handleCitySearch = (e) => {
    const city = e.target.value;
    setCityFilter(city);
    fetchRobots(statusFilter, city);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleRegisterRobot = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormSubmitting(true);
    try {
      await api.post("/admin/robots", {
        name: form.name,
        serialNumber: form.serialNumber,
        status: form.status,
        location: {
          label: form["location.label"],
          city: form["location.city"],
          latitude: form["location.latitude"]
            ? Number(form["location.latitude"])
            : undefined,
          longitude: form["location.longitude"]
            ? Number(form["location.longitude"])
            : undefined,
        },
        notes: form.notes,
      });
      setFormSuccess("Robot registered successfully.");
      setForm(EMPTY_FORM);
      fetchRobots(statusFilter, cityFilter);
      fetchSummary();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to register robot.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStatusUpdate = async (robotId, newStatus) => {
    setUpdatingId(robotId);
    try {
      await api.patch(`/admin/robots/${robotId}`, { status: newStatus });
      setRobots((current) =>
        current.map((r) =>
          r._id === robotId ? { ...r, status: newStatus } : r,
        ),
      );
      fetchSummary();
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
    }
  };

  const inputStyle = {
    padding: "0.65rem 0.85rem",
    borderRadius: "12px",
    border: "1px solid rgba(0,85,204,0.12)",
    background: "#fff",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    fontSize: "0.82rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
  };

  if (authLoading) return null;

  return (
    <div className="page-shell">
      <div className="feature-page-hero feature-page-card">
        <p className="feature-eyebrow">Admin</p>
        <h1 className="feature-title">Robots Management</h1>
        <p className="feature-copy">
          Monitor robot status, locations, and assigned campaigns. Register new
          robots and update their status directly from here.
        </p>
      </div>

      {pageError && (
        <div
          className="feature-page-card"
          style={{
            marginBottom: "1rem",
            color: "var(--danger)",
            fontWeight: 600,
          }}
        >
          {pageError}
        </div>
      )}

      {summary && (
        <div
          className="feature-metrics-row"
          style={{ marginBottom: "1.25rem" }}
        >
          <div className="feature-metric-card">
            <span style={{ color: "#005570" }}>{summary.online}</span>
            <p>Online</p>
          </div>
          <div className="feature-metric-card">
            <span style={{ color: "#444" }}>{summary.offline}</span>
            <p>Offline</p>
          </div>
          <div className="feature-metric-card">
            <span style={{ color: "#8a4f08" }}>{summary.maintenance}</span>
            <p>Maintenance</p>
          </div>
          <div className="feature-metric-card">
            <span>{summary.total}</span>
            <p>Total robots</p>
          </div>
        </div>
      )}

      <div className="feature-page-card" style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {["", "online", "offline", "maintenance"].map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "999px",
                border: "1px solid rgba(0,85,204,0.2)",
                background:
                  statusFilter === s ? "var(--accent-blue)" : "transparent",
                color: statusFilter === s ? "#fff" : "var(--text-secondary)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {s ? STATUS_LABELS[s] : "All"}
            </button>
          ))}
          <input
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={handleCitySearch}
            style={{
              marginLeft: "auto",
              padding: "0.45rem 0.85rem",
              borderRadius: "12px",
              border: "1px solid rgba(0,85,204,0.15)",
              background: "#fff",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              minWidth: "160px",
            }}
          />
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: "var(--accent-blue)",
              color: "#fff",
              fontFamily: "var(--font-heading)",
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {showForm ? "Cancel" : "+ Register robot"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="feature-page-card" style={{ marginBottom: "1rem" }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.82rem",
              color: "var(--accent-blue)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            Register new robot
          </p>
          <form onSubmit={handleRegisterRobot}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <label style={labelStyle}>
                Robot name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  style={inputStyle}
                  placeholder="Lobby Bot 1"
                />
              </label>
              <label style={labelStyle}>
                Serial number *
                <input
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={handleFormChange}
                  required
                  style={inputStyle}
                  placeholder="TLG-2024-001"
                />
              </label>
              <label style={labelStyle}>
                Initial status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  style={inputStyle}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
              <label style={labelStyle}>
                City
                <input
                  name="location.city"
                  value={form["location.city"]}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Pune"
                />
              </label>
              <label style={labelStyle}>
                Location label
                <input
                  name="location.label"
                  value={form["location.label"]}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Phoenix Mall - Entrance"
                />
              </label>
              <label style={labelStyle}>
                Notes
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  style={inputStyle}
                  placeholder="Any notes about this robot"
                />
              </label>
            </div>
            {formError && (
              <p
                style={{
                  color: "var(--danger)",
                  fontSize: "0.88rem",
                  marginBottom: "0.5rem",
                }}
              >
                {formError}
              </p>
            )}
            {formSuccess && (
              <p
                style={{
                  color: "var(--success)",
                  fontSize: "0.88rem",
                  marginBottom: "0.5rem",
                }}
              >
                {formSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={formSubmitting}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #00abc9, #005cd6)",
                color: "#fff",
                fontFamily: "var(--font-heading)",
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: formSubmitting ? "wait" : "pointer",
                opacity: formSubmitting ? 0.75 : 1,
              }}
            >
              {formSubmitting ? "Registering..." : "Register robot"}
            </button>
          </form>
        </div>
      )}

      <div className="feature-page-card">
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading robots...</p>
        ) : robots.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No robots found.</p>
        ) : (
          <div className="feature-table-list">
            {robots.map((robot) => {
              const tone = STATUS_COLORS[robot.status] || {};
              return (
                <div
                  className="feature-table-row"
                  key={robot._id}
                  style={{ padding: "1rem 1.1rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: "var(--text-primary)",
                          fontSize: "0.95rem",
                        }}
                      >
                        {robot.name}
                      </p>
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.88rem",
                          marginTop: "0.2rem",
                        }}
                      >
                        {robot.serialNumber}
                        {robot.location?.label && ` · ${robot.location.label}`}
                        {robot.location?.city && ` · ${robot.location.city}`}
                      </p>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                          marginTop: "0.15rem",
                        }}
                      >
                        Last seen: {formatDate(robot.lastSeenAt)}
                      </p>
                      {robot.assignedCampaigns?.length > 0 && (
                        <div
                          style={{
                            marginTop: "0.5rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.4rem",
                          }}
                        >
                          {robot.assignedCampaigns.map((c) => (
                            <span
                              key={c._id}
                              style={{
                                padding: "0.25rem 0.6rem",
                                borderRadius: "999px",
                                background: "rgba(0,85,204,0.08)",
                                color: "var(--accent-blue)",
                                fontSize: "0.78rem",
                                fontFamily: "var(--font-heading)",
                              }}
                            >
                              {c.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-heading)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          background: tone.bg,
                          color: tone.color,
                        }}
                      >
                        {STATUS_LABELS[robot.status] || robot.status}
                      </span>
                      <select
                        value={robot.status}
                        disabled={updatingId === robot._id}
                        onChange={(e) =>
                          handleStatusUpdate(robot._id, e.target.value)
                        }
                        style={{
                          padding: "0.3rem 0.5rem",
                          borderRadius: "10px",
                          border: "1px solid rgba(0,85,204,0.15)",
                          background: "#fff",
                          color: "var(--text-secondary)",
                          fontSize: "0.8rem",
                          cursor: updatingId === robot._id ? "wait" : "pointer",
                        }}
                      >
                        <option value="online">Set online</option>
                        <option value="offline">Set offline</option>
                        <option value="maintenance">Set maintenance</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRobots;