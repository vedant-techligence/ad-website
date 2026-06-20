import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { formatDate } from "../utils/format";
import "./FeaturePages.css";

const TYPE_ICONS = { campaign: "📢", report: "📄", health: "💚", system: "⚙️", geo: "🗺️" };
const SEVERITY_STYLES = {
  info:     { bg: "rgba(0,85,204,0.1)",     color: "#003a96" },
  success:  { bg: "rgba(10,141,107,0.12)",  color: "#0a8d6b" },
  warning:  { bg: "rgba(198,126,16,0.14)",  color: "#8a4f08" },
  critical: { bg: "rgba(178,41,75,0.12)",  color: "#9d2040" },
};

function Notifications() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ unread: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications", { params: { limit: 50 } });
      setItems(response.data.items || []);
      setStats(response.data.stats || { unread: 0, total: 0 });
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void api.get("/notifications", { params: { limit: 50 } }).then((response) => {
      if (!active) return;
      setItems(response.data.items || []);
      setStats(response.data.stats || { unread: 0, total: 0 });
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError("Failed to load notifications.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      toast.success("Marked as read.");
      await loadNotifications();
    } catch {
      toast.error("Failed to update notification.");
    }
  };

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      toast.success("All notifications marked as read.");
      await loadNotifications();
    } catch {
      toast.error("Failed to update notifications.");
    }
  };

  const displayed = filter === "all"
    ? items
    : filter === "unread"
      ? items.filter((n) => !n.isRead)
      : items.filter((n) => n.type === filter);

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Notifications System</p>
        <h1 className="feature-title">Alerts &amp; Updates</h1>
        <p className="feature-copy">
          Campaign health alerts, report readiness notices, robot geo events, and system messages
          — all in one place with read/unread tracking.
        </p>
      </section>

      {error && <p className="page-width feature-error-box" style={{ marginTop: "1rem" }}>{error}</p>}

      {/* Stats */}
      <section className="page-width feature-metrics-row" style={{ marginTop: "1.25rem" }}>
        {["all", "unread", "campaign", "report", "health", "system", "geo"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`feature-tab-btn${filter === f ? " active" : ""}`}
            style={{ padding: "0.45rem 0.95rem" }}
          >
            {TYPE_ICONS[f] || ""} {f === "all" ? `All (${stats.total})` : f === "unread" ? `Unread (${stats.unread})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </section>

      <section className="page-width feature-card feature-page-card" style={{ marginTop: "1.25rem" }}>
        <div className="feature-header-row">
          <div>
            <p className="section-kicker">Inbox</p>
            <h2 className="feature-title">{stats.unread} unread of {stats.total} total</h2>
          </div>
          {stats.unread > 0 && (
            <button className="feature-primary-button" type="button" onClick={markAll} style={{ marginTop: 0 }}>
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading notifications...</p>
        ) : displayed.length === 0 ? (
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No notifications in this category.</p>
        ) : (
          <div className="feature-list">
            {displayed.map((item) => {
              const sev = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info;
              return (
                <article
                  key={item._id}
                  className={`feature-notification-card ${item.isRead ? "is-read" : "is-unread"}`}
                  style={{ borderLeft: `4px solid ${sev.color}` }}
                >
                  <div style={{ display: "flex", gap: "0.75rem", flex: 1 }}>
                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{TYPE_ICONS[item.type] || "🔔"}</span>
                    <div style={{ flex: 1 }}>
                      <h3>{item.title}</h3>
                      <p style={{ marginTop: "0.2rem" }}>{item.message}</p>
                      <div className="feature-chip-row" style={{ marginTop: "0.5rem" }}>
                        <span style={{ background: sev.bg, color: sev.color }}>{item.severity}</span>
                        <span>{item.type}</span>
                        {item.ctaLabel && <span>{item.ctaLabel}</span>}
                        <span style={{ background: "transparent", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0, alignItems: "flex-end" }}>
                    {!item.isRead ? (
                      <button type="button" onClick={() => markRead(item._id)} style={{ border: "none", borderRadius: "14px", padding: "0.5rem 0.85rem", background: "linear-gradient(135deg, #00abc9, #005cd6)", color: "#fff", fontFamily: "var(--font-heading)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                        Mark read
                      </button>
                    ) : (
                      <small style={{ color: "var(--text-muted)", fontWeight: 700 }}>Read</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notifications;
