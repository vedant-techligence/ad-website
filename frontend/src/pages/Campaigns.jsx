import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./Campaigns.css";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  title: "",
  brandName: "",
  robotPlacement: "",
  destinationUrl: "",
  description: "",
  callToAction: "",
  spokenWords: "",
  slideText: "",
  startDate: "",
  endDate: "",
  repeatRate: 3,
  dailyBudgetCap: "",
};

const STATUS_LABELS = {
  draft: "Draft",
  pending_payment: "Awaiting payment",
  paid_pending_verification: "In verification",
  public: "Public",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PUBLIC_LIKE_STATUSES = new Set(["public", "completed"]);
const NEGATIVE_STATUSES = new Set(["rejected", "cancelled"]);

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function Campaigns() {
  const fileInputRef = useRef(null);
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCampaigns = async () => {
    const response = await api.get("/campaigns", { params: { limit: 20 } });
    setCampaigns(response.data.items);
    setLoading(false);
  };

  const [driveUrl, setDriveUrl] = useState("");
  const [importingDrive, setImportingDrive] = useState(false);
  const [driveError, setDriveError] = useState("");

  const [importedAssets, setImportedAssets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    let active = true;

    const fetch = async () => {
      try {
        const response = await api.get("/campaigns", {
          params: { limit: 20 },
        });

        if (!active) return;

        setCampaigns(response.data.items || response.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetch();

    return () => {
      active = false;
    };
  }, [authLoading, user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const resetForm = ({ clearFeedback = true } = {}) => {
    setForm(INITIAL_FORM);
    setFiles([]);
    setEditingId("");
    if (clearFeedback) {
      setError("");
      setSuccess("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (campaign) => {
    setEditingId(campaign._id);
    setForm({
      title: campaign.title || "",
      brandName: campaign.brandName || "",
      robotPlacement: campaign.robotPlacement || "",
      destinationUrl: campaign.destinationUrl || "",
      description: campaign.description || "",
      callToAction: campaign.callToAction || "",
      spokenWords: campaign.spokenWords || "",
      slideText: campaign.slideText || "",
    });
    setFiles([]);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (campaignId) => {
    const confirmed = window.confirm("Delete this campaign?");
    if (!confirmed) return;

    try {
      await api.delete(`/campaigns/${campaignId}`);
      toast.success("Campaign deleted.");

      if (editingId === campaignId) {
        resetForm();
      }

      await loadCampaigns();
    } catch (err) {
      toast.error("Failed to delete campaign");
    }
  };

  const handleImportFromDrive = async () => {
    setDriveError("");

    if (!driveUrl.trim()) {
      setDriveError("Paste a Google Drive share link first.");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setImportingDrive(true);

    try {
      const response = await api.post("/campaigns/import-drive-video", {
        driveUrl: driveUrl.trim(),
      });

      setImportedAssets((current) => [...current, response.data.mediaAsset]);
      setDriveUrl("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }

      setDriveError(
        requestError.response?.data?.message ||
          "Couldn't import that video from Google Drive. Check the link and sharing permissions.",
      );
    } finally {
      setImportingDrive(false);
    }
  };

  const removeImportedAsset = (storedName) => {
    setImportedAssets((current) =>
      current.filter((asset) => asset.storedName !== storedName),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (
      !form.startDate ||
      !form.endDate ||
      !form.repeatRate ||
      !form.dailyBudgetCap
    ) {
      setError(
        "Start date, end date, repeat rate, and daily budget cap are all required.",
      );
      setSubmitting(false);
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after the start date.");
      setSubmitting(false);
      return;
    }

    if (!user) {
      navigate("/login");
      setSubmitting(false);
      return;
    }
    
    const formData = new FormData();

    // 1. Append normal string fields safely
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "repeatRate" && key !== "dailyBudgetCap") {
        formData.append(key, value);
      }
    });

    // 2. Handle numeric fields explicitly
    formData.append("repeatRate", Number(form.repeatRate));
    formData.append("dailyBudgetCap", Number(form.dailyBudgetCap));

    // 3. Append files separately
    files.forEach((file) => {
      formData.append("mediaFiles", file);
    });

    // 4. Optional imported assets
    if (importedAssets.length) {
      formData.append(
        "importedMediaAssets",
        JSON.stringify(importedAssets)
      );
    }
    try {
      if (editingId) {
        await api.patch(`/campaigns/${editingId}`, formData);
        setSuccess("Campaign updated successfully.");
      } else {
        const response = await api.post("/campaigns", formData);
        setCampaigns((current) => [response.data, ...current]);
        setSuccess("Campaign submitted successfully.");
      }

      resetForm({ clearFeedback: false });
      await loadCampaigns();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        requestError.response?.data?.message || "Failed to save campaign.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resolveMediaUrl = (publicUrl) =>
    publicUrl?.startsWith("http") ? publicUrl : `${API_ORIGIN}${publicUrl}`;

  const publicCampaigns = campaigns.filter(
    (campaign) => campaign.isPublic,
  ).length;

  const blockedCampaigns = campaigns.filter(
    (campaign) => campaign.status === "rejected",
  ).length;

  const totalAssets = campaigns.reduce(
    (count, c) => count + (c.mediaAssets?.length || 0),
    0,
  );

  const downloadReport = (id) => {
    window.open(`${API_ORIGIN}/api/campaigns/${id}/report`, "_blank");
  };

  const emailReport = async (id) => {
    try {
      await api.post(`/campaigns/${id}/report/email`);

      alert("Report emailed successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to send report.");
    }
  };

  return (
    <div className="campaigns-page">
      <section className="campaigns-hero">
        <div className="campaigns-hero-copy-block">
          <p className="campaigns-eyebrow">Campaign Management</p>
          <h1>Create and manage robot campaigns</h1>
          <p className="campaigns-hero-copy">
            Submit the campaign copy, schedule, spoken words, slide text, and
            creative files. Campaigns save as drafts, then move to payment and
            verification before going live on robot displays.
          </p>
          <div className="campaigns-stat-row">
            <div className="campaigns-stat-card">
              <span>{publicCampaigns}</span>
              <p>Public campaigns</p>
            </div>
            <div className="campaigns-stat-card">
              <span>{blockedCampaigns}</span>
              <p>Blocked campaigns</p>
            </div>
            <div className="campaigns-stat-card">
              <span>{totalAssets}</span>
              <p>Media files tracked</p>
            </div>
          </div>
        </div>
        <div className="campaigns-hero-panel">
          <h2>What is included now</h2>
          <ul>
            <li>
              Campaign title, description, CTA, transcript, and slide text
            </li>
            <li>All uploaded file names, formats, and size limits</li>
            <li>Risky or inappropriate words before robot display goes live</li>
          </ul>
        </div>
      </section>

      <section className="campaigns-layout">
        <form className="campaigns-form-card" onSubmit={handleSubmit}>
          <div className="campaigns-form-header">
            <div>
              <p className="campaigns-section-label">New Campaign</p>
              <h2>Create campaign draft</h2>
            </div>
            {editingId ? (
              <button
                className="campaigns-dashboard-link"
                type="button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          {(error || success) && (
            <p
              className={`campaigns-message ${error ? "campaigns-error" : "campaigns-success"}`}
            >
              {error || success}
            </p>
          )}

          <div className="campaigns-grid">
            <label>
              Campaign title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Summer launch on lobby robots"
                required
              />
            </label>
            <label>
              Brand name
              <input
                name="brandName"
                value={form.brandName}
                onChange={handleChange}
                placeholder="Techligence Ads"
                required
              />
            </label>
            <label>
              Robot placement
              <input
                name="robotPlacement"
                value={form.robotPlacement}
                onChange={handleChange}
                placeholder="Hotel lobby, mall kiosk, hospital reception"
                required
              />
            </label>
            <label>
              Destination URL
              <input
                name="destinationUrl"
                value={form.destinationUrl}
                onChange={handleChange}
                placeholder="https://example.com/campaign"
              />
            </label>

            <label>
              Start date
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              End date
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Repeat rate (plays/day)
              <input
                type="number"
                name="repeatRate"
                min="1"
                max="20"
                value={form.repeatRate}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Daily budget cap (₹)
              <input
                type="number"
                name="dailyBudgetCap"
                min="0"
                step="1"
                value={form.dailyBudgetCap}
                onChange={handleChange}
                placeholder="500"
                required
              />
            </label>
          </div>

          <label>
            Ad copy
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the message that will be shown publicly."
              rows="4"
              required
            />
          </label>

          <label>
            Call to action
            <input
              name="callToAction"
              value={form.callToAction}
              onChange={handleChange}
              placeholder="Scan to book now"
            />
          </label>

          <label>
            Spoken words or transcript
            <textarea
              name="spokenWords"
              value={form.spokenWords}
              onChange={handleChange}
              placeholder="Paste the voiceover or spoken words used in the video."
              rows="4"
            />
          </label>

          <label>
            On-screen slide or visual text
            <textarea
              name="slideText"
              value={form.slideText}
              onChange={handleChange}
              placeholder="List the slide text, subtitles, overlays, or visible text."
              rows="4"
            />
          </label>

          <label className="campaigns-upload">
            Upload creative files
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
            />
            <span>Optional on edit. Upload up to 6 image/video files.</span>
          </label>

          {!!files.length && (
            <div className="campaigns-selected-files">
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`}>{file.name}</span>
              ))}
            </div>
          )}

          <button
            className="campaigns-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving campaign..." : "Save as draft"}
          </button>
        </form>

        <div className="campaigns-list-card">
          <div className="campaigns-form-header">
            <div>
              <p className="campaigns-section-label">Campaign Queue</p>
              <h2>Your latest submissions</h2>
            </div>
          </div>

          {loading ? (
            <p className="campaigns-empty">Loading campaigns...</p>
          ) : campaigns.length ? (
            <div className="campaigns-list">
              {campaigns.map((campaign) => {
                const statusLabel =
                  STATUS_LABELS[campaign.status] || campaign.status;
                const badgeTone = PUBLIC_LIKE_STATUSES.has(campaign.status)
                  ? "campaign-badge-public"
                  : NEGATIVE_STATUSES.has(campaign.status)
                    ? "campaign-badge-rejected"
                    : "campaign-badge-pending";

                return (
                  <article className="campaign-card" key={campaign._id}>
                    <div className="campaign-card-top">
                      <div>
                        <p className="campaign-card-title">{campaign.title}</p>
                        <p className="campaign-card-meta">
                          {campaign.brandName} • {campaign.robotPlacement}
                        </p>
                      </div>
                      <span className={`campaign-badge ${badgeTone}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <p className="campaign-card-copy">{campaign.description}</p>
                    {campaign.verification?.checkedAt ? (
                      <div className="campaign-card-audit">
                        <p>
                          Checked:{" "}
                          {dateFormatter.format(
                            new Date(campaign.verification.checkedAt),
                          )}
                        </p>
                        <p>
                          Risk level:{" "}
                          <span className="campaign-risk">
                            {campaign.verification.riskLevel}
                          </span>
                        </p>
                        {!!campaign.verification.checksSummary && (
                          <p>{campaign.verification.checksSummary}</p>
                        )}
                      </div>
                    ) : (
                      <p className="campaign-card-pending-note">
                        {campaign.status === "draft"
                          ? "Draft — complete payment to send this for verification."
                          : "Verification hasn't run yet."}
                      </p>
                    )}

                    {!!campaign.verification?.flaggedTerms?.length && (
                      <div className="campaign-chip-group">
                        {campaign.verification.flaggedTerms.map((term) => (
                          <span
                            className="campaign-chip campaign-chip-alert"
                            key={term}
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    )}

                    {!!campaign.verification?.issues?.length && (
                      <ul className="campaign-issues">
                        {campaign.verification.issues.map((issue, index) => (
                          <li key={`${campaign._id}-issue-${index}`}>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    )}

                    {!!campaign.mediaAssets?.length && (
                      <div className="campaign-media-grid">
                        {campaign.mediaAssets.map((asset) =>
                          asset.kind === "image" ? (
                            <img
                              key={asset.storedName}
                              src={resolveMediaUrl(asset.publicUrl)}
                              alt={asset.originalName}
                            />
                          ) : (
                            <video
                              key={asset.storedName}
                              src={resolveMediaUrl(asset.publicUrl)}
                              controls
                              muted
                            />
                          ),
                        )}
                      </div>
                    )}
                    {campaign.status === "completed" &&
                      campaign.report?.pdfPath && (
                        <div className="campaign-report-actions">
                          <button
                            type="button"
                            className="campaign-report-btn"
                            onClick={() => downloadReport(campaign._id)}
                          >
                            Download Report
                          </button>

                          <button
                            type="button"
                            className="campaign-report-btn"
                            onClick={() => emailReport(campaign._id)}
                          >
                            Email Report
                          </button>
                        </div>
                      )}

                    <div className="campaign-action-row">
                      <button
                        type="button"
                        className="campaign-action-button"
                        onClick={() => handleEdit(campaign)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="campaign-action-button campaign-action-delete"
                        onClick={() => handleDelete(campaign._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="campaigns-empty">
              No campaigns yet. Your approved uploads will appear here as
              public-ready robot ads.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Campaigns;
