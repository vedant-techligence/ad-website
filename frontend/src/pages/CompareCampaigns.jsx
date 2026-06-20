import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";
import { currency, percent } from "../utils/format";
import "./FeaturePages.css";

function CompareCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState({ items: [], winner: null });
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    let active = true;
    void api.get("/campaigns", { params: { limit: 20 } }).then((response) => {
      if (!active) return;
      setCampaigns(response.data.items || []);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      toast.error("Failed to load campaigns.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const canCompare = selected.length >= 2;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const compare = async () => {
    if (!canCompare) { toast.error("Select at least two campaigns."); return; }
    setComparing(true);
    try {
      const response = await api.get("/campaigns/compare", {
        params: { campaignIds: selected.join(",") },
      });
      setComparison(response.data);
      toast.success("Comparison ready.");
    } catch {
      toast.error("Comparison failed.");
    } finally {
      setComparing(false);
    }
  };

  const toggle = (id) =>
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= 3
          ? [...cur.slice(1), id]
          : [...cur, id],
    );

  const barColors = ["#00a8cc", "#0055cc", "#0a8d6b"];

  return (
    <div className="page-shell">
      {/* Header */}
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Campaign Comparison</p>
        <h1 className="feature-title">Benchmark campaigns side by side</h1>
        <p className="feature-copy">
          Compare health score, spend, ROAS, CTR, sentiment, and conversions across your
          most important robot ad campaigns. Select 2–3 below, then run the comparison.
        </p>
      </section>

      {/* Campaign selector */}
      <section className="page-width feature-card feature-page-card" style={{ marginTop: "1.25rem" }}>
        <div className="feature-header-row">
          <div>
            <p className="section-kicker">Select Campaigns</p>
            <h2 className="feature-title">{selected.length} / 3 selected</h2>
          </div>
          <button
            type="button"
            onClick={compare}
            disabled={!canCompare || comparing}
            className="feature-primary-button"
            style={{ marginTop: 0 }}
          >
            {comparing ? "Comparing..." : "Run comparison"}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No campaigns found. Create one first.</p>
        ) : (
          <div className="feature-checkbox-grid" style={{ marginTop: "1rem" }}>
            {campaigns.map((campaign) => {
              const isSelected = selectedSet.has(campaign._id);
              return (
                <label
                  key={campaign._id}
                  className="feature-checkbox-card"
                  style={{
                    border: isSelected
                      ? "2px solid var(--accent-cyan)"
                      : "1px solid rgba(0,85,204,0.1)",
                    background: isSelected
                      ? "rgba(0,168,204,0.08)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(244,251,255,0.98))",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(campaign._id)}
                    style={{ marginTop: "0.25rem", accentColor: "var(--accent-cyan)" }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)", fontSize: "0.88rem" }}>
                      {campaign.title}
                    </strong>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {campaign.brandName}
                    </p>
                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(0,85,204,0.1)", color: "var(--accent-blue)", fontSize: "0.75rem", fontWeight: 700 }}>
                        Health {campaign.healthScore}
                      </span>
                      <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", background: "rgba(198,126,16,0.12)", color: "#8a4f08", fontSize: "0.75rem", fontWeight: 700 }}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </section>

      {/* Results */}
      {comparison.items.length > 0 && (
        <>
          {/* Winner banner */}
          {comparison.winner && (
            <section className="page-width" style={{ marginTop: "1.25rem" }}>
              <div style={{
                padding: "1.2rem 1.5rem",
                borderRadius: "22px",
                background: "linear-gradient(135deg, rgba(10,141,107,0.12), rgba(0,168,204,0.08))",
                border: "1px solid rgba(10,141,107,0.25)",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}>
                <span style={{ fontSize: "2rem" }}>🏆</span>
                <div>
                  <p style={{ fontFamily: "var(--font-heading)", color: "#0a8d6b", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Top performer</p>
                  <p style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontSize: "1.2rem", marginTop: "0.2rem" }}>
                    {comparison.winner.title}
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                    Health {comparison.winner.healthScore} · ROAS {comparison.winner.roas}x · {comparison.winner.brandName}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Comparison cards */}
          <section className="page-width feature-comparison-grid" style={{ marginTop: "1.25rem" }}>
            {comparison.items.map((item, i) => (
              <article
                key={item.id}
                className="feature-comparison-card"
                style={{
                  borderTop: `3px solid ${barColors[i] || "#00a8cc"}`,
                  padding: "1.2rem",
                }}
              >
                <h3 style={{ fontSize: "1rem" }}>{item.title}</h3>
                <p style={{ color: "var(--text-secondary)" }}>{item.brandName}</p>
                <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.75rem" }}>
                  <MetricRow label="Health" value={item.healthScore} color={barColors[i]} />
                  <MetricRow label="CTR" value={percent(item.ctr)} />
                  <MetricRow label="Spend" value={currency(item.spend)} />
                  <MetricRow label="Revenue" value={currency(item.revenue)} />
                  <MetricRow label="ROAS" value={`${item.roas}x`} />
                  <MetricRow label="Conversions" value={(item.conversions || 0).toLocaleString("en-IN")} />
                  <MetricRow label="Impressions" value={(item.impressions || 0).toLocaleString("en-IN")} />
                  <MetricRow label="Sentiment" value={item.sentimentScore} />
                </div>
              </article>
            ))}
          </section>

          {/* Bar chart */}
          <section className="page-width feature-card feature-page-card" style={{ marginTop: "1.25rem" }}>
            <p className="section-kicker">Visual Comparison</p>
            <h2 className="feature-title">Health score &amp; ROAS side by side</h2>
            <div className="feature-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison.items} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                  <XAxis dataKey="title" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #c0dce8" }} />
                  <Legend />
                  <Bar dataKey="healthScore" name="Health Score" radius={[8, 8, 0, 0]}>
                    {comparison.items.map((_, i) => (
                      <Cell key={i} fill={barColors[i] || "#00a8cc"} />
                    ))}
                  </Bar>
                  <Bar dataKey="roas" name="ROAS" fill="#a96413" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Spend vs Revenue chart */}
          <section className="page-width feature-card feature-page-card" style={{ marginTop: "1.25rem", marginBottom: "1.25rem" }}>
            <p className="section-kicker">Budget Efficiency</p>
            <h2 className="feature-title">Spend vs Revenue</h2>
            <div className="feature-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison.items} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e8f3" />
                  <XAxis dataKey="title" tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#2a4a6a", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #c0dce8" }} formatter={(v) => currency(v)} />
                  <Legend />
                  <Bar dataKey="spend" name="Spend (₹)" fill="#b2294b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue (₹)" fill="#0a8d6b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: "1px solid rgba(0,85,204,0.06)" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.88rem", color: color || "var(--accent-blue)", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

export default CompareCampaigns;
