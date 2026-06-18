import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import "./FeaturePages.css";

function Reports() {
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({
    name: "Executive performance brief",
    type: "executive",
    format: "json",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    const response = await api.get("/reports", { params: { limit: 20 } });
    setReports(response.data.items);
  };

  useEffect(() => {
    let active = true;

    void api.get("/reports", { params: { limit: 20 } }).then((response) => {
      if (!active) {
        return;
      }

      setReports(response.data.items);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/reports", form);
      toast.success("Report generated.");
      await loadReports();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reportId) => {
    await api.delete(`/reports/${reportId}`);
    toast.success("Report deleted.");
    await loadReports();
  };

  return (
    <div className="page-shell">
      <section className="page-width feature-page-hero feature-card">
        <p className="section-kicker">Reports Center</p>
        <h1 className="feature-title">Campaign Reports</h1>
        <p className="feature-copy">
          Generate structured reports from the same Mongo-backed analytics data without changing your original application flow.
        </p>
      </section>

      <section className="page-width feature-grid-two">
        <form className="feature-card feature-page-card feature-form-card" onSubmit={handleSubmit}>
          <p className="section-kicker">Generate Report</p>
          <h2 className="feature-title">Create a new report</h2>
          <label>
            Report name
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="executive">Executive</option>
              <option value="performance">Performance</option>
              <option value="sentiment">Sentiment</option>
              <option value="geo">Geo</option>
              <option value="comparison">Comparison</option>
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
        </form>

        <div className="feature-card feature-page-card">
          <p className="section-kicker">Available Reports</p>
          <h2 className="feature-title">Saved report artifacts</h2>
          <div className="feature-table-list">
            {reports.map((report) => (
              <article key={report._id} className="feature-table-row">
                <div>
                  <h3>{report.name}</h3>
                  <p>{report.type} • {report.format} • {report.status}</p>
                </div>
                <button type="button" onClick={() => handleDelete(report._id)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Reports;
