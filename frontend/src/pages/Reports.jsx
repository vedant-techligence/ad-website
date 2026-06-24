import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import "./FeaturePages.css";

const TYPE_OPTIONS = ["executive", "performance", "sentiment", "geo", "comparison"];

function Reports() {
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({ name: "Executive performance brief", type: "executive", format: "json" });
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadReports = async () => {
    const res = await api.get("/reports", { params: { limit: 20 } });
    setReports(res.data.items || []);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/reports", { params: { limit: 20 } }),
      api.get("/campaigns", { params: { limit: 50 } }),
    ]).then(([rRes, cRes]) => {
      if (!active) return;
      setReports(rRes.data.items || []);
      setCampaigns((cRes.data.items || []).filter((c) => c.status === "completed" || c.status === "public"));
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/reports", form);
      toast.success("Report generated.");
      await loadReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCampaignReport = async (campaignId, campaignTitle) => {
    setSubmitting(true);
    try {
      await api.post("/reports", {
        name: `Campaign Report — ${campaignTitle}`,
        type: "performance",
        format: "json",
        filters: { campaignId },
      });
      toast.success("Campaign report generated.");
      await loadReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await api.delete(`/reports/${reportId}`);
      toast.success("Report deleted.");
      await loadReports();
    } catch {
      toast.error("Failed to delete report.");
    }
  };

  const statusColor = (status) =>
    status === "ready" ? "#00a8cc" : status === "error" ? "#cc0000" : "#888";

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Reports Center</p>
        <h1 className="feature-title">Campaign Reports</h1>
        <p className="feature-copy">
          Generate structured reports from your campaign analytics data.
        </p>
      </section>

      <section className="page-width feature-grid-two">
        {/* Generate report form */}
        <form className="feature-card feature-page-card feature-form-card" onSubmit={handleSubmit}>
          <p className="section-kicker">Generate Report</p>
          <h2 className="feature-title">New report</h2>

          <label>
            Report name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </label>

          <label>
            Format
            <select name="format" value={form.format} onChange={handleChange}>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </label>

          <button className="feature-primary-button" type="submit" disabled={submitting}>
            {submitting ? "Generating..." : "Generate report"}
          </button>

          {campaigns.length > 0 && (
            <>
              <p className="section-kicker" style={{ marginTop: "1.5rem" }}>Per-Campaign Reports</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {campaigns.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    className="feature-primary-button"
                    style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-accent)" }}
                    onClick={() => handleCampaignReport(c._id, c.title)}
                    disabled={submitting}
                  >
                    Report for: {c.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </form>

        {/* Report list */}
        <div className="feature-card feature-page-card">
          <p className="section-kicker">Saved Reports</p>
          <h2 className="feature-title">Report artifacts</h2>

          {reports.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No reports yet. Generate one to get started.</p>
          )}

          <div className="feature-table-list">
            {reports.map((report) => (
              <article key={report._id} className="feature-table-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{report.name}</h3>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {report.type} • {report.format} •{" "}
                      <span style={{ color: statusColor(report.status) }}>{report.status}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      style={{ fontSize: "0.8rem", padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border-accent)", background: "transparent", color: "var(--accent-cyan)", cursor: "pointer" }}
                      onClick={() => setExpanded(expanded === report._id ? null : report._id)}
                    >
                      {expanded === report._id ? "Hide" : "View"}
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: "0.8rem", padding: "4px 10px", borderRadius: 4, border: "1px solid #cc0000", background: "transparent", color: "#cc0000", cursor: "pointer" }}
                      onClick={() => handleDelete(report._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expanded === report._id && (
                  <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "1rem", fontSize: "0.85rem" }}>
                    {report.summary && <p style={{ marginBottom: "0.75rem", color: "var(--text-secondary)" }}>{report.summary}</p>}

                    {report.metrics && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        {Object.entries(report.metrics).map(([key, val]) => (
                          <div key={key} style={{ background: "var(--bg-card)", borderRadius: 4, padding: "0.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                              {typeof val === "number" ? val.toLocaleString("en-IN") : val}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{key}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {report.sections?.map((section, i) => (
                      <div key={i} style={{ marginBottom: "0.5rem" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{section.title}</strong>
                        <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0, color: "var(--text-secondary)" }}>
                          {section.points?.map((pt, j) => <li key={j}>{pt}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Reports;
