import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import "./FeaturePages.css";

function Notifications() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ unread: 0, total: 0 });

  const loadNotifications = async () => {
    const response = await api.get("/notifications", { params: { limit: 30 } });
    setItems(response.data.items);
    setStats(response.data.stats);
  };

  useEffect(() => {
    let active = true;

    void api.get("/notifications", { params: { limit: 30 } }).then((response) => {
      if (!active) {
        return;
      }

      setItems(response.data.items);
      setStats(response.data.stats);
    });

    return () => {
      active = false;
    };
  }, []);

  const markRead = async (notificationId) => {
    await api.patch(`/notifications/${notificationId}/read`);
    toast.success("Notification marked as read.");
    await loadNotifications();
  };

  const markAll = async () => {
    await api.patch("/notifications/read-all");
    toast.success("All notifications marked as read.");
    await loadNotifications();
  };

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Notifications System</p>
        <h1 className="feature-title">Alerts and Updates</h1>
        <p className="feature-copy">
          Review campaign health updates, report generation notifications, system messages,
          and geo alerts without changing your existing app layout.
        </p>
      </section>

      <section className="page-width feature-card feature-page-card">
        <div className="feature-header-row">
          <div>
            <p className="section-kicker">Inbox</p>
            <h2 className="feature-title">Unread {stats.unread} of {stats.total}</h2>
          </div>
          <button className="feature-primary-button" type="button" onClick={markAll}>
            Mark all as read
          </button>
        </div>
        <div className="feature-list">
          {items.map((item) => (
            <article key={item._id} className={`feature-notification-card ${item.isRead ? "is-read" : "is-unread"}`}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <div className="feature-chip-row">
                  <span>{item.type}</span>
                  <span>{item.severity}</span>
                  {item.ctaLabel ? <span>{item.ctaLabel}</span> : null}
                </div>
              </div>
              {!item.isRead ? (
                <button type="button" onClick={() => markRead(item._id)}>
                  Mark as read
                </button>
              ) : (
                <small>Read</small>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Notifications;
