import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";
import { compactNumber, currency, percent } from "../utils/format";
import "./Dashboard.css";

const SEVERITY_COLORS = {
  info: "#0055cc",
  success: "#0a8d6b",
  warning: "#a96413",
  critical: "#b2294b",
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState(30);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void api
      .get(`/dashboard/overview?range=${range}`)
      .then((response) => {
        if (!active) return;
        setOverview(response.data.overview);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load dashboard data.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [range]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          <p>Loading your campaign workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          <p style={{ color: "var(--danger)" }}>{error || "No data available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <section className="dashboard-hero page-width">
        <div className="dashboard-hero-card feature-card">
          <p className="dashboard-eyebrow">Campaign Command Center</p>
          <h1>Techligence Robot Advertisement Platform</h1>
          <p className="dashboard-hero-copy">
            Monitor campaign delivery, compare performance, track robot coverage,
            and generate reports — all in one place.
          </p>
          <div className="dashboard-hero-actions">
            <Link className="dashboard-link" to="/campaigns">Manage Campaigns</Link>
            <Link className="dashboard-link dashboard-link-secondary" to="/analytics">Open Analytics</Link>
            <Link className="dashboard-link dashboard-link-secondary" to="/geo">View Geo</Link>
          </div>
        </div>
      </section>

      {/* Range picker */}
      <section className="page-width" style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setRange(d)}
            className={`dash-range-btn${range === d ? " active" : ""}`}
          >
            {d}d
          </button>
        ))}
      </section>

      {/* Metrics */}
      <section className="dashboard-metrics page-width">
        <MetricCard
          label="Total campaigns"
          value={overview.totals.campaigns}
          sub={`${overview.totals.activeCampaigns} active now`}
          accent="#0055cc"
        />
        <MetricCard
          label="Total impressions"
          value={compactNumber(overview.totals.impressions)}
          sub={`CTR ${percent(overview.totals.ctr)}`}
          accent="#00a8cc"
        />
        <MetricCard
          label="Attributed revenue"
          value={currency(overview.totals.revenue)}
          sub={`Spend ${currency(overview.totals.spend)}`}
          accent="#0a8d6b"
        />
        <MetricCard
          label="Avg health score"
          value={overview.totals.averageHealth}
          sub={`Sentiment ${overview.totals.averageSentiment}`}
          accent="#a96413"
        />
        <MetricCard
          label="Conversions"
          value={compactNumber(overview.totals.conversions)}
          sub={`Engagement ${percent(overview.totals.engagementRate)}`}
          accent="#b2294b"
        />
        <MetricCard
          label="Robot fleet"
          value={overview.robotSummary?.total ?? "—"}
          sub={`${overview.robotSummary?.active ?? 0} active · ${overview.robotSummary?.cities ?? 0} cities`}
          accent="#0055cc"
        />
      </section>

      {/* Main grid: trend chart + top campaigns */}
      <section className="dashboard-grid page-width" style={{ marginTop: "1.5rem" }}>
        <div className="dashboard-panel feature-card">
          <p className="dashboard-eyebrow">Performance Trend</p>
          <h2>Impressions &amp; conversions — last {range} days</h2>
          <div className="dashboard-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.performanceTrend}>
                <defs>
                  <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a8cc" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#00a8cc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0055cc" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#0055cc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                <XAxis dataKey="date" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #c0dce8", background: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="#00a8cc"
                  strokeWidth={2.5}
                  fill="url(#impGrad)"
                  dot={false}
                  name="Impressions"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="#0055cc"
                  strokeWidth={2}
                  fill="url(#convGrad)"
                  dot={false}
                  name="Conversions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-panel feature-card">
          <p className="dashboard-eyebrow">Top Campaigns</p>
          <h2>Best current performers</h2>
          <div className="dashboard-top-list" style={{ marginTop: "1rem" }}>
            {overview.topCampaigns.length ? (
              overview.topCampaigns.map((campaign) => (
                <article key={campaign.id} className="dashboard-top-card">
                  <div>
                    <h3>{campaign.title}</h3>
                    <p>{campaign.brandName} · {campaign.placement}</p>
                  </div>
                  <div className="dashboard-top-meta">
                    <span>Health {campaign.healthScore}</span>
                    <span>Sentiment {campaign.sentimentScore}</span>
                    <span style={{ color: "var(--success)", fontSize: "0.8rem" }}>
                      {currency(campaign.budgetSpent)} spent
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No campaigns yet. Create one to see data here.</p>
            )}
          </div>
        </div>
      </section>

      {/* Secondary grid: shortcuts + channel performance + notifications */}
      <section className="dashboard-grid page-width" style={{ marginTop: "1.4rem" }}>
        <div className="dashboard-panel feature-card">
          <p className="dashboard-eyebrow">Quick Access</p>
          <h2>All platform modules</h2>
          <div className="dashboard-shortcuts">
            <ShortcutCard title="Analytics" description="Charts, sentiment, channel trends, and campaign comparison." to="/analytics" icon="📊" />
            <ShortcutCard title="Campaigns" description="Create, edit, and manage robot ad campaigns." to="/campaigns" icon="📢" />
            <ShortcutCard title="Reports" description="Generate performance, geo, and executive reports." to="/reports" icon="📄" />
            <ShortcutCard title="Notifications" description="Health alerts, system events, and updates." to="/notifications" icon="🔔" />
            <ShortcutCard title="Geo Analytics" description="Robot locations, city reach, and route coverage." to="/geo" icon="🗺️" />
            <ShortcutCard title="Billing" description="Campaign costs, payment history, and estimates." to="/billing" icon="💳" />
          </div>
        </div>

        <div className="dashboard-panel feature-card">
          <p className="dashboard-eyebrow">Latest Alerts</p>
          <h2>Recent notifications</h2>
          <div style={{ display: "grid", gap: "0.8rem", marginTop: "1rem" }}>
            {(overview.notifications || []).length ? (
              overview.notifications.slice(0, 4).map((n) => (
                <div key={n._id} className="dashboard-notif-row" style={{ borderLeftColor: SEVERITY_COLORS[n.severity] || "#0055cc" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.88rem", color: "var(--text-primary)" }}>{n.title}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.2rem" }}>{n.message}</p>
                  </div>
                  <span className={`dash-severity dash-severity-${n.severity}`}>{n.severity}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No notifications yet.</p>
            )}
            <Link to="/notifications" style={{ color: "var(--accent-blue)", fontWeight: 600, fontSize: "0.88rem" }}>
              View all notifications →
            </Link>
          </div>
        </div>
      </section>

      {/* Channel performance */}
      {overview.channelPerformance?.length > 0 && (
        <section className="page-width" style={{ marginTop: "1.4rem" }}>
          <div className="dashboard-panel feature-card">
            <p className="dashboard-eyebrow">Channel Performance</p>
            <h2>Budget and health by channel</h2>
            <div className="dashboard-channel-grid" style={{ marginTop: "1rem" }}>
              {overview.channelPerformance.map((ch) => (
                <div key={ch.channel} className="dashboard-channel-card">
                  <p className="dashboard-channel-name">{ch.channel}</p>
                  <div className="dashboard-channel-stats">
                    <span>{ch.campaigns} campaign{ch.campaigns !== 1 ? "s" : ""}</span>
                    <span>Avg health {ch.avgHealthScore}</span>
                    <span>{currency(ch.budget)} spent</span>
                  </div>
                  <div className="dashboard-channel-bar">
                    <div
                      className="dashboard-channel-fill"
                      style={{ width: `${Math.min(100, ch.avgHealthScore)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <article className="dashboard-metric-card" style={{ borderTop: `3px solid ${accent}` }}>
      <span style={{ color: accent }}>{value}</span>
      <p>{label}</p>
      <small>{sub}</small>
    </article>
  );
}

function ShortcutCard({ title, description, to, icon }) {
  return (
    <Link className="dashboard-shortcut-card" to={to}>
      <span className="dashboard-shortcut-icon">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </Link>
  );
}

export default Dashboard;
