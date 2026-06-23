import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./AdminAnalytics.css";
import api from "../../api/axios";

function AdminAnalytics() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/analytics/overview", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOverview(res.data.data))
      .catch(() => {});
  }, [token]);

  return (
    <div className="page-shell">
      <div className="feature-page-hero feature-page-card">
        <p className="feature-eyebrow">Admin</p>
        <h1 className="feature-title">Analytics</h1>
        <p className="feature-copy">
          Campaign performance, audience sentiment, geo analytics, and health
          scores. .
        </p>
      </div>

      {/* Placeholder metric cards — values will be real once analytics are built */}
      <div className="feature-metrics-row" style={{ marginBottom: "1.25rem" }}>
        <div className="feature-metric-card">
          <span>{overview?.totalImpressions ?? "—"}</span>
          <p>Total impressions</p>
        </div>
        <div className="feature-metric-card">
          <span>{overview?.totalDisplays ?? "—"}</span>
          <p>Total displays</p>
        </div>
        <div className="feature-metric-card">
          <span>{overview?.activeRobots ?? "—"}</span>
          <p>Active robots</p>
        </div>
        <div className="feature-metric-card">
          <span>{overview?.totalReach ?? "—"}</span>
          <p>Total reach</p>
        </div>
      </div>

      <div
        className="feature-page-card"
        style={{ textAlign: "center", padding: "3rem 2rem" }}
      >
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.82rem",
            color: "var(--accent-blue)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          Integration pending
        </p>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "0.75rem" }}>
          Analytics module is under development
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            maxWidth: "48ch",
            margin: "0 auto",
          }}
        >
          Anshul &amp; Yash are building the full analytics system — sentiment
          analysis, geo maps, campaign health scores, and emotion detection.
          This page will be populated once that integration is complete.
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            marginTop: "1.5rem",
          }}
        >
          Available data for integration: Campaign (status, dates, targeting,
          repeatRate) · Robot (location, assignedCampaigns) · Payment (amount,
          status) — all accessible via MongoDB Atlas shared cluster.
        </p>
      </div>
    </div>
  );
}

export default AdminAnalytics;