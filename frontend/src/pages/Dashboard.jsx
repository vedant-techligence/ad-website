import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { compactNumber, currency, percent } from "../utils/format";
import "./Dashboard.css";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let active = true;

    void api.get("/dashboard/overview?range=30").then((response) => {
      if (!active) {
        return;
      }

      setOverview(response.data.overview);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !overview) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Dashboard</h2>
          <p>Loading your campaign workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero page-width">
        <div className="dashboard-hero-card feature-card">
          <p className="dashboard-eyebrow">Campaign Command Center</p>
          <h1>Techligence Robot Advertisement Platform</h1>
          <p className="dashboard-hero-copy">
            Monitor campaign delivery, compare performance, track robot coverage,
            and generate reports without leaving your existing workspace flow.
          </p>
          <div className="dashboard-hero-actions">
            <Link className="dashboard-link" to="/campaigns">
              Manage Campaigns
            </Link>
            <Link className="dashboard-link dashboard-link-secondary" to="/analytics">
              Open Analytics
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-metrics page-width">
        <article className="dashboard-metric-card">
          <span>{overview.totals.campaigns}</span>
          <p>Total campaigns</p>
          <small>{overview.totals.activeCampaigns} active right now</small>
        </article>
        <article className="dashboard-metric-card">
          <span>{compactNumber(overview.totals.impressions)}</span>
          <p>Total impressions</p>
          <small>CTR {percent(overview.totals.ctr)}</small>
        </article>
        <article className="dashboard-metric-card">
          <span>{currency(overview.totals.revenue)}</span>
          <p>Attributed revenue</p>
          <small>Spend {currency(overview.totals.spend)}</small>
        </article>
        <article className="dashboard-metric-card">
          <span>{overview.totals.averageHealth}</span>
          <p>Health score</p>
          <small>Sentiment {overview.totals.averageSentiment}</small>
        </article>
      </section>

      <section className="dashboard-grid page-width">
        <div className="dashboard-panel feature-card">
          <p className="dashboard-eyebrow">Quick Access</p>
          <h2>New feature pages added to your previous app</h2>
          <div className="dashboard-shortcuts">
            <ShortcutCard
              title="Analytics"
              description="Charts, channel performance, sentiment, and campaign comparison."
              to="/analytics"
            />
            <ShortcutCard
              title="Reports"
              description="Generate performance, executive, sentiment, and geo reports."
              to="/reports"
            />
            <ShortcutCard
              title="Notifications"
              description="Read health alerts, system events, and report readiness updates."
              to="/notifications"
            />
            <ShortcutCard
              title="Geo Analytics"
              description="Track robot locations, route coverage, and city-level reach."
              to="/geo"
            />
          </div>
        </div>

        <div className="dashboard-panel feature-card">
          <p className="dashboard-eyebrow">Top Campaigns</p>
          <h2>Best current performers</h2>
          <div className="dashboard-top-list">
            {overview.topCampaigns.map((campaign) => (
              <article key={campaign.id} className="dashboard-top-card">
                <div>
                  <h3>{campaign.title}</h3>
                  <p>{campaign.brandName}</p>
                </div>
                <div className="dashboard-top-meta">
                  <span>Health {campaign.healthScore}</span>
                  <span>Sentiment {campaign.sentimentScore}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ShortcutCard({ title, description, to }) {
  return (
    <Link className="dashboard-shortcut-card" to={to}>
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  );
}

export default Dashboard;
