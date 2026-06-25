import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import toast from "react-hot-toast";
import api from "../api/axios";
import { compactNumber, currency, percent } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import "./FeaturePages.css";

const SENTIMENT_COLORS = ["#00a8cc", "#89a9c9", "#b2294b"];
const HEALTH_COLORS = { excellent: "#0a8d6b", good: "#a96413", atRisk: "#b2294b" };

function Analytics() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [health, setHealth] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [range, setRange] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let active = true;
    setLoadingAll(true);

    void Promise.all([
      api.get(`/dashboard/overview?range=${range}`),
      api.get(`/analytics/sentiment?range=${range}`),
      api.get("/analytics/health-scores"),
      api.get("/campaigns", { params: { limit: 20 } }),
    ]).then(([ovRes, sentRes, healthRes, campRes]) => {
      if (!active) return;
      setOverview(ovRes.data.overview);
      setSentiment(sentRes.data);
      setHealth(healthRes.data);
      setCampaigns(campRes.data.items || []);
      setLoadingAll(false);
    }).catch(() => {
      if (!active) return;
      toast.error("Failed to load analytics data.");
      setLoadingAll(false);
    });

    return () => { active = false; };
  }, [range]);

  const sentimentData = useMemo(() => {
    if (!overview) return [];
    return [
      { name: "Positive", value: overview.sentimentBreakdown.positive, fill: SENTIMENT_COLORS[0] },
      { name: "Neutral", value: overview.sentimentBreakdown.neutral, fill: SENTIMENT_COLORS[1] },
      { name: "Negative", value: overview.sentimentBreakdown.negative, fill: SENTIMENT_COLORS[2] },
    ];
  }, [overview]);

  const healthDistData = useMemo(() => {
    if (!health) return [];
    return [
      { name: "Excellent (≥80)", value: health.distribution.excellent, fill: HEALTH_COLORS.excellent },
      { name: "Good (65–79)", value: health.distribution.good, fill: HEALTH_COLORS.good },
      { name: "At Risk (<65)", value: health.distribution.atRisk, fill: HEALTH_COLORS.atRisk },
    ];
  }, [health]);

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 campaigns.");
      return;
    }
    setLoadingComparison(true);
    try {
      const response = await api.get("/campaigns/compare", {
        params: { campaignIds: selectedIds.join(",") },
      });
      setComparison(response.data);
      toast.success("Comparison loaded.");
    } catch {
      toast.error("Comparison failed.");
    } finally {
      setLoadingComparison(false);
    }
  };

  if (loadingAll) {
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
      {/* Hero */}
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Analytics Overview</p>
        <h1 className="feature-title">
          Ad Performance Overview
          {user?.role === "admin" && (
            <span style={{ fontSize: "0.8rem", marginLeft: "0.75rem", padding: "0.2rem 0.5rem", background: "#fef3c7", color: "#d97706", borderRadius: "99px", verticalAlign: "middle" }}>
              All Users Data
            </span>
          )}
        </h1>
        <p className="feature-copy">
          Performance trends, interactive funnel analysis, sentiment breakdowns, health scores, and
          campaign comparison — all driven by live MongoDB data.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          {["overview", "funnel", "sentiment", "health", "comparison"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`feature-tab-btn${activeTab === tab ? " active" : ""}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRange(d)}
                className={`feature-tab-btn${range === d ? " active" : ""}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics row */}
      <section className="page-width feature-metrics-row" style={{ marginTop: "1.25rem" }}>
        <MetricCard label="Impressions" value={compactNumber(overview?.totals.impressions)} helper={`CTR ${percent(overview?.totals.ctr)}`} />
        <MetricCard label="Conversions" value={compactNumber(overview?.totals.conversions)} helper={`Engagement ${percent(overview?.totals.engagementRate)}`} />
        <MetricCard label="Revenue" value={currency(overview?.totals.revenue)} helper={`Spend ${currency(overview?.totals.spend)}`} />
        <MetricCard label="Avg Health" value={overview?.totals.averageHealth ?? "—"} helper={`Sentiment ${overview?.totals.averageSentiment ?? "—"}`} />
      </section>

      {/* Tab content */}
      {activeTab === "overview" && (
        <>
          {/* Performance trend */}
          <section className="page-width feature-grid-two">
            <div className="feature-card feature-page-card feature-chart-card">
              <p className="section-kicker">Performance Trend</p>
              <h2 className="feature-title">Impressions &amp; conversions</h2>
              <div className="feature-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overview?.performanceTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                    <XAxis dataKey="date" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Legend />
                    <Line type="monotone" dataKey="impressions" stroke="#00a8cc" strokeWidth={3} dot={false} name="Impressions" />
                    <Line type="monotone" dataKey="conversions" stroke="#0055cc" strokeWidth={2} dot={false} name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="feature-card feature-page-card feature-chart-card">
              <p className="section-kicker">Channel Performance</p>
              <h2 className="feature-title">Budget &amp; health by channel</h2>
              <div className="feature-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.channelPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                    <XAxis dataKey="channel" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Legend />
                    <Bar dataKey="budget" fill="#00a8cc" radius={[10, 10, 0, 0]} name="Budget spent" />
                    <Bar dataKey="avgHealthScore" fill="#0055cc" radius={[10, 10, 0, 0]} name="Avg health" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Top campaigns */}
          <section className="page-width feature-card feature-page-card" style={{ marginBottom: "1.3rem" }}>
            <p className="section-kicker">Campaign Health Scores</p>
            <h2 className="feature-title">Top campaigns by performance</h2>
            <div className="feature-list">
              {(overview?.topCampaigns || []).map((campaign) => (
                <article key={campaign.id} className="feature-list-card">
                  <div style={{ flex: 1 }}>
                    <h3>{campaign.title}</h3>
                    <p>{campaign.brandName} · {campaign.placement}</p>
                  </div>
                  <div className="feature-chip-column">
                    <span style={{ background: "rgba(0,168,204,0.1)", color: "#00556f" }}>Views {compactNumber(campaign.impressions)}</span>
                    <span style={{ background: "rgba(10,141,107,0.1)", color: "#0a8d6b" }}>Revenue {currency(campaign.revenue)}</span>
                    <span>Health {campaign.healthScore}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeTab === "funnel" && (
        <section className="page-width feature-card feature-page-card" style={{ marginBottom: "1.3rem" }}>
          <p className="section-kicker">Interaction Funnel</p>
          <h2 className="feature-title">Audience Journey</h2>
          
          <div className="feature-grid-two" style={{ marginTop: "1.5rem" }}>
            <div className="feature-list" style={{ flex: 1 }}>
              <article className="feature-list-card" style={{ borderLeft: "4px solid #00a8cc" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.2rem" }}>1. Looked at Robot (Impressions)</h3>
                  <p>People who saw the robot displaying the ad</p>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{compactNumber(overview?.totals.impressions)}</span>
                </div>
              </article>
              <article className="feature-list-card" style={{ borderLeft: "4px solid #0088aa", marginLeft: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.2rem" }}>2. Seen Ad (Reach)</h3>
                  <p>Unique individuals who visited the robot</p>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{compactNumber(overview?.totals.reach)}</span>
                </div>
              </article>
              <article className="feature-list-card" style={{ borderLeft: "4px solid #006688", marginLeft: "2rem" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1.2rem" }}>3. Interacted with Robot</h3>
                  <p>People who actively engaged with the robot</p>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{compactNumber(overview?.totals.robotInteractions)}</span>
                </div>
              </article>
            </div>
            
            <div className="feature-list" style={{ flex: 1 }}>
              <h3 className="feature-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Outcome Breakdown</h3>
              <article className="feature-list-card" style={{ background: "#f8fafc" }}>
                <div style={{ flex: 1 }}>
                  <h3>Asked Questions</h3>
                  <p>Enquired about product/robot</p>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>{compactNumber(overview?.totals.questionsAskedCount)}</span>
                </div>
              </article>
              <article className="feature-list-card" style={{ background: "#f8fafc" }}>
                <div style={{ flex: 1 }}>
                  <h3>Watched Only</h3>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>{compactNumber(overview?.totals.actionWatchedOnly)}</span>
                </div>
              </article>
              <article className="feature-list-card" style={{ background: "#f8fafc" }}>
                <div style={{ flex: 1 }}>
                  <h3>Signed Up</h3>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>{compactNumber(overview?.totals.actionSignup)}</span>
                </div>
              </article>
              <article className="feature-list-card" style={{ background: "#f8fafc" }}>
                <div style={{ flex: 1 }}>
                  <h3>Booked Slot</h3>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>{compactNumber(overview?.totals.actionBooked)}</span>
                </div>
              </article>
              <article className="feature-list-card" style={{ background: "#f8fafc" }}>
                <div style={{ flex: 1 }}>
                  <h3>Downloaded Brochure</h3>
                </div>
                <div className="feature-chip-column">
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#0f172a" }}>{compactNumber(overview?.totals.actionDownloaded)}</span>
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {activeTab === "sentiment" && (
        <>
          <section className="page-width feature-grid-two">
            <div className="feature-card feature-page-card feature-chart-card">
              <p className="section-kicker">Sentiment Breakdown</p>
              <h2 className="feature-title">Audience response mix</h2>
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {sentimentData.map((s) => (
                  <span key={s.name} style={{ padding: "0.3rem 0.75rem", borderRadius: "999px", background: s.fill + "22", color: s.fill, fontWeight: 700, fontSize: "0.85rem" }}>
                    {s.name}: {s.value}
                  </span>
                ))}
              </div>
              <div className="feature-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} dataKey="value" innerRadius={62} outerRadius={110} paddingAngle={4} nameKey="name" label>
                      {sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="feature-card feature-page-card feature-chart-card">
              <p className="section-kicker">Sentiment Trend</p>
              <h2 className="feature-title">Average score over time</h2>
              <div className="feature-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentiment?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                    <XAxis dataKey="date" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Line type="monotone" dataKey="avgSentiment" stroke="#00a8cc" strokeWidth={3} dot={false} name="Avg sentiment" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="page-width feature-card feature-page-card" style={{ marginBottom: "1.3rem" }}>
            <p className="section-kicker">Per Campaign</p>
            <h2 className="feature-title">Sentiment breakdown by campaign</h2>
            <div className="feature-list">
              {(sentiment?.byCampaign || []).map((c) => (
                <article key={c.id} className="feature-list-card">
                  <div style={{ flex: 1 }}>
                    <h3>{c.title}</h3>
                    <p>{c.brandName}</p>
                  </div>
                  <div className="feature-chip-column">
                    <span style={{ background: "rgba(0,168,204,0.1)", color: "#00556f" }}>Positive {c.positive}</span>
                    <span style={{ background: "rgba(137,169,201,0.15)", color: "#2a4a6a" }}>Neutral {c.neutral}</span>
                    <span style={{ background: "rgba(178,41,75,0.12)", color: "#9d2040" }}>Negative {c.negative}</span>
                  </div>
                </article>
              ))}
            </div>
            <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              {sentiment?.integrationNote}
            </p>
          </section>
        </>
      )}

      {activeTab === "health" && (
        <>
          <section className="page-width feature-grid-two">
            <div className="feature-card feature-page-card feature-chart-card">
              <p className="section-kicker">Health Distribution</p>
              <h2 className="feature-title">Score tiers across all campaigns</h2>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {healthDistData.map((d) => (
                  <div key={d.name} style={{ textAlign: "center" }}>
                    <span style={{ display: "block", fontFamily: "var(--font-heading)", fontSize: "1.6rem", color: d.fill }}>{d.value}</span>
                    <small style={{ color: "var(--text-muted)" }}>{d.name}</small>
                  </div>
                ))}
              </div>
              <div className="feature-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                    <XAxis dataKey="name" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} name="Campaigns">
                      {healthDistData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="feature-card feature-page-card">
              <p className="section-kicker">Campaign Health List</p>
              <h2 className="feature-title">All campaigns ranked by health</h2>
              <div className="feature-list" style={{ maxHeight: "380px", overflowY: "auto" }}>
                {(health?.items || []).map((c) => (
                  <article key={c.id} className="feature-list-card">
                    <div style={{ flex: 1 }}>
                      <h3>{c.title}</h3>
                      <p>{c.brandName}</p>
                      {c.insights?.[0] && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{c.insights[0]}</p>}
                    </div>
                    <div className="feature-chip-column">
                      <span style={{
                        background: c.healthScore >= 80 ? "rgba(10,141,107,0.12)" : c.healthScore >= 65 ? "rgba(198,126,16,0.14)" : "rgba(178,41,75,0.12)",
                        color: c.healthScore >= 80 ? "#0a8d6b" : c.healthScore >= 65 ? "#8a4f08" : "#9d2040",
                      }}>Health {c.healthScore}</span>
                      <span>Sentiment {c.sentimentScore}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === "comparison" && (
        <section className="page-width feature-card feature-page-card" style={{ marginBottom: "1.3rem" }}>
          <p className="section-kicker">Campaign Comparison</p>
          <h2 className="feature-title">Compare campaigns side by side</h2>
          <p className="feature-copy feature-copy-tight">
            Select 2–3 campaigns to compare spend, ROAS, health, and sentiment.
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
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Health {campaign.healthScore}</p>
                </div>
              </label>
            ))}
          </div>
          <button
            className="feature-primary-button"
            type="button"
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || loadingComparison}
          >
            {loadingComparison ? "Comparing..." : `Run comparison (${selectedIds.length} selected)`}
          </button>

          {comparison && (
            <>
              {comparison.winner && (
                <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: "18px", background: "rgba(10,141,107,0.1)", border: "1px solid rgba(10,141,107,0.2)" }}>
                  <p style={{ fontFamily: "var(--font-heading)", color: "#0a8d6b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>🏆 Winner</p>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", color: "var(--text-primary)", marginTop: "0.3rem" }}>{comparison.winner.title}</p>
                  <p style={{ color: "var(--text-secondary)" }}>Health {comparison.winner.healthScore} · ROAS {comparison.winner.roas}</p>
                </div>
              )}
              <div className="feature-comparison-grid" style={{ marginTop: "1.25rem" }}>
                {comparison.items.map((item) => (
                  <article key={item.id} className="feature-comparison-card">
                    <h3>{item.title}</h3>
                    <p>{item.brandName}</p>
                    <span>Health {item.healthScore}</span>
                    <span>CTR {percent(item.ctr)}</span>
                    <span>Spend {currency(item.spend)}</span>
                    <span>Revenue {currency(item.revenue)}</span>
                    <span>ROAS {item.roas}x</span>
                    <span>Impressions {compactNumber(item.impressions)}</span>
                  </article>
                ))}
              </div>

              {/* Comparison bar chart */}
              <div style={{ marginTop: "1.5rem", height: "280px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison.items}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                    <XAxis dataKey="title" tick={{ fontSize: 11, fill: "#2a4a6a" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#2a4a6a" }} />
                    <Tooltip contentStyle={{ borderRadius: "12px" }} />
                    <Legend />
                    <Bar dataKey="healthScore" fill="#00a8cc" radius={[8, 8, 0, 0]} name="Health Score" />
                    <Bar dataKey="roas" fill="#0055cc" radius={[8, 8, 0, 0]} name="ROAS" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      )}
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
