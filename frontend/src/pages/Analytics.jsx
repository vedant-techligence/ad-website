import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";
import { compactNumber, currency, percent } from "../utils/format";
import "./FeaturePages.css";

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([
      api.get("/dashboard/overview?range=30"),
      api.get("/campaigns", { params: { limit: 20 } }),
    ]).then(([overviewResponse, campaignsResponse]) => {
      if (!active) {
        return;
      }

      setOverview(overviewResponse.data.overview);
      setCampaigns(campaignsResponse.data.items || []);
    });

    return () => {
      active = false;
    };
  }, []);

  const sentimentData = useMemo(() => {
    if (!overview?.sentimentBreakdown) return [];
    return [
      { name: "Positive", value: overview.sentimentBreakdown.positive, fill: "#00a8cc" },
      { name: "Neutral", value: overview.sentimentBreakdown.neutral, fill: "#89a9c9" },
      { name: "Negative", value: overview.sentimentBreakdown.negative, fill: "#b2294b" },
    ];
  }, [overview]);

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      return;
    }

    setLoadingComparison(true);
    try {
      const response = await api.get("/campaigns/compare", {
        params: { campaignIds: selectedIds.join(",") },
      });
      setComparison(response.data);
    } finally {
      setLoadingComparison(false);
    }
  };

  if (!overview) {
    return (
      <div className="page-shell">
        <div className="page-width feature-card feature-page-card">
          <h2 className="feature-title">Loading analytics...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Analytics Overview</p>
        <h1 className="feature-title">Campaign Analytics</h1>
        <p className="feature-copy">
          This page adds the new analytics layer to your earlier app without changing the
          existing campaign flow: performance charts, sentiment, channel trends, and comparison.
        </p>
      </section>

      <section className="page-width feature-metrics-row">
        <MetricCard label="Impressions" value={compactNumber(overview.totals?.impressions)} helper={`CTR ${percent(overview.totals?.ctr)}`} />
        <MetricCard label="Conversions" value={compactNumber(overview.totals?.conversions)} helper={`Engagement ${percent(overview.totals?.engagementRate)}`} />
        <MetricCard label="Revenue" value={currency(overview.totals?.revenue)} helper={`Spend ${currency(overview.totals?.spend)}`} />
        <MetricCard label="Avg Health" value={overview.totals?.averageHealth} helper={`Sentiment ${overview.totals?.averageSentiment}`} />
      </section>

      <section className="page-width feature-grid-two">
        <div className="feature-card feature-page-card feature-chart-card">
          <p className="section-kicker">Performance Trend</p>
          <h2 className="feature-title">Impressions and conversions</h2>
          <div className="feature-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.performanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                <XAxis dataKey="date" tick={{ fill: "#2a4a6a", fontSize: 12 }} />
                <YAxis tick={{ fill: "#2a4a6a", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="impressions" stroke="#00a8cc" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="#0055cc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="feature-card feature-page-card feature-chart-card">
          <p className="section-kicker">Sentiment Analysis</p>
          <h2 className="feature-title">Audience response mix</h2>
          <div className="feature-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} dataKey="value" innerRadius={62} outerRadius={110} paddingAngle={4}>
                  {sentimentData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="page-width feature-grid-two">
        <div className="feature-card feature-page-card feature-chart-card">
          <p className="section-kicker">Channel Performance</p>
          <h2 className="feature-title">Budget and health by channel</h2>
          <div className="feature-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.channelPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                <XAxis dataKey="channel" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#2a4a6a", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="budget" fill="#00a8cc" radius={[10, 10, 0, 0]} />
                <Bar dataKey="avgHealthScore" fill="#0055cc" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="feature-card feature-page-card">
          <p className="section-kicker">Campaign Health Score</p>
          <h2 className="feature-title">Top campaigns right now</h2>
          <div className="feature-list">
            {(overview.topCampaigns || []).map((campaign) => (
              <article key={campaign.id} className="feature-list-card">
                <div>
                  <h3>{campaign.title}</h3>
                  <p>{campaign.brandName}</p>
                </div>
                <div className="feature-chip-column">
                  <span>Health {campaign.healthScore}</span>
                  <span>Sentiment {campaign.sentimentScore}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-width feature-card feature-page-card">
        <p className="section-kicker">Campaign Comparison</p>
        <h2 className="feature-title">Compare campaigns side by side</h2>
        <p className="feature-copy feature-copy-tight">
          Select two or three campaigns to compare spend, ROAS, health, and response signals.
        </p>
        <div className="feature-checkbox-grid">
          {campaigns.map((campaign) => (
            <label key={campaign._id} className="feature-checkbox-card">
              <input
                type="checkbox"
                checked={selectedIds.includes(campaign._id)}
                onChange={() =>
                  setSelectedIds((current) =>
                    current.includes(campaign._id)
                      ? current.filter((item) => item !== campaign._id)
                      : current.length >= 3
                        ? [...current.slice(1), campaign._id]
                        : [...current, campaign._id],
                  )
                }
              />
              <div>
                <strong>{campaign.title}</strong>
                <p>{campaign.brandName}</p>
              </div>
            </label>
          ))}
        </div>
        <button className="feature-primary-button" type="button" onClick={handleCompare} disabled={selectedIds.length < 2 || loadingComparison}>
          {loadingComparison ? "Comparing..." : "Run comparison"}
        </button>

        {comparison ? (
          <div className="feature-comparison-grid">
            {(comparison.items || []).map((item) => (
              <article key={item.id} className="feature-comparison-card">
                <h3>{item.title}</h3>
                <p>{item.brandName}</p>
                <span>Health {item.healthScore}</span>
                <span>CTR {percent(item.ctr)}</span>
                <span>Spend {currency(item.spend)}</span>
                <span>ROAS {item.roas}</span>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <article className="feature-metric-card">
      <span>{value}</span>
      <p>{label}</p>
      <small>{helper}</small>
    </article>
  );
}

export default Analytics;
