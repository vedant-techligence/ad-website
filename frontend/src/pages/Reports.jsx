import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { formatDate } from "../utils/format";
import "./FeaturePages.css";

const REPORT_TYPES = ["executive", "performance", "sentiment", "geo", "comparison"];
const FORMATS = ["json", "pdf", "csv"];

const TYPE_DESCRIPTIONS = {
  executive: "High-level summary for leadership — revenue, health, and placement efficiency.",
  performance: "Full breakdown of impressions, conversions, CTR, and spend across campaigns.",
  sentiment: "Audience response patterns and mention volume across all robot placements.",
  geo: "Robot deployment coverage, city-level exposure, and routing performance.",
  comparison: "Side-by-side benchmarks of selected campaigns.",
};

const STATUS_COLORS = {
  ready: { bg: "rgba(10,141,107,0.12)", color: "#0a8d6b" },
  queued: { bg: "rgba(198,126,16,0.14)", color: "#8a4f08" },
  failed: { bg: "rgba(178,41,75,0.12)", color: "#9d2040" },
};

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    name: "Executive performance brief",
    type: "executive",
    format: "json",
  });

  const loadReports = async () => {
    try {
      const response = await api.get("/reports", { params: { limit: 20 } });
      setReports(response.data.items || []);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void api.get("/reports", { params: { limit: 20 } }).then((response) => {
      if (!active) return;
      setReports(response.data.items || []);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError("Failed to load reports.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((cur) => ({ ...cur, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/reports", form);
      toast.success("Report generated successfully.");
      await loadReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await api.delete(`/reports/${reportId}`);
      toast.success("Report deleted.");
      await loadReports();
    } catch {
      toast.error("Failed to delete report.");
    }
  };

  const handleView = (reportId) => {
    setExpandedId((cur) => (cur === reportId ? null : reportId));
  };

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Reports Center</p>
        <h1 className="feature-title">Campaign Reports</h1>
        <p className="feature-copy">
          Generate structured reports from live MongoDB analytics data. Choose type, format,
          and name — the platform aggregates campaign health, spend, sentiment, and geo data automatically.
        </p>
      </section>

      {error && <p className="page-width feature-error-box" style={{ marginTop: "1rem" }}>{error}</p>}

      <section className="page-width feature-grid-two">
        {/* Form */}
        <form className="feature-card feature-page-card feature-form-card" onSubmit={handleSubmit}>
          <p className="section-kicker">Generate Report</p>
          <h2 className="feature-title">Create a new report</h2>

          <label>
            Report name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Report type
            <select name="type" value={form.type} onChange={handleChange}>
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </label>

          {form.type && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "-0.5rem" }}>
              {TYPE_DESCRIPTIONS[form.type]}
            </p>
          )}

          <label>
            Output format
            <select name="format" value={form.format} onChange={handleChange}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
          </label>

          <button className="feature-primary-button" type="submit" disabled={submitting}>
            {submitting ? "Generating..." : "Generate report"}
          </button>
        </form>

        {/* List */}
        <div className="feature-card feature-page-card">
          <p className="section-kicker">Available Reports</p>
          <h2 className="feature-title">Saved report artifacts</h2>

          {loading ? (
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No reports yet. Generate one to see it here.</p>
          ) : (
            <div className="feature-table-list">
              {reports.map((report) => {
                const statusStyle = STATUS_COLORS[report.status] || STATUS_COLORS.ready;
                const isExpanded = expandedId === report._id;

                return (
                  <article key={report._id} style={{ borderRadius: "22px", border: "1px solid rgba(0,85,204,0.1)", background: "rgba(248,252,255,0.96)", padding: "1rem", marginBottom: "0.1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontSize: "0.95rem" }}>{report.name}</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.2rem" }}>
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)} · {report.format.toUpperCase()} · {formatDate(report.generatedAt)}
                        </p>
                        {report.summary && (
                          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", marginTop: "0.3rem" }}>{report.summary}</p>
                        )}
                      </div>
                      <span style={{ padding: "0.3rem 0.7rem", borderRadius: "999px", fontFamily: "var(--font-heading)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", background: statusStyle.bg, color: statusStyle.color, flexShrink: 0 }}>
                        {report.status}
                      </span>
                    </div>

                    {/* Metrics row */}
                    {report.metrics && Object.keys(report.metrics).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                        {Object.entries(report.metrics).map(([key, val]) => (
                          <span key={key} style={{ padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(0,168,204,0.1)", color: "#00556f", fontSize: "0.8rem", fontWeight: 700 }}>
                            {key}: {typeof val === "number" && val > 1000 ? val.toLocaleString("en-IN") : val}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded sections */}
                    {isExpanded && report.sections?.length > 0 && (
                      <div style={{ marginTop: "0.85rem", padding: "0.85rem", borderRadius: "14px", background: "rgba(240,249,255,0.8)" }}>
                        {report.sections.map((section, i) => (
                          <div key={i} style={{ marginBottom: "0.75rem" }}>
                            <p style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", fontSize: "0.85rem" }}>{section.title}</p>
                            <ul style={{ paddingLeft: "1rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                              {(section.points || []).map((pt, j) => <li key={j} style={{ fontSize: "0.88rem" }}>{pt}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
                      <button
                        type="button"
                        onClick={() => handleView(report._id)}
                        style={{ border: "1px solid rgba(0,85,204,0.16)", borderRadius: "999px", padding: "0.45rem 0.85rem", background: "rgba(255,255,255,0.88)", color: "var(--accent-blue)", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}
                      >
                        {isExpanded ? "Collapse" : "View details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(report._id)}
                        style={{ border: "1px solid rgba(178,41,75,0.2)", borderRadius: "999px", padding: "0.45rem 0.85rem", background: "rgba(255,255,255,0.88)", color: "var(--danger)", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Reports;
