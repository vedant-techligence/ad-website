import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api, { API_ORIGIN } from "../api/axios";
import "./Campaigns.css";

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

  // ---- Google Drive video import state ----
  const [driveUrl, setDriveUrl] = useState("");
  const [importingDrive, setImportingDrive] = useState(false);
  const [driveError, setDriveError] = useState("");
  const [importedAssets, setImportedAssets] = useState([]); // assets pulled in from Drive, held until form submit

  useEffect(() => {
    let active = true;

    void api.get("/campaigns", { params: { limit: 20 } }).then((response) => {
      if (!active) {
        return;
      }

      setCampaigns(response.data.items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

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
    if (!confirmed) {
      return;
    }

    await api.delete(`/campaigns/${campaignId}`);
    toast.success("Campaign deleted.");
    if (editingId === campaignId) {
      resetForm();
    }
    await loadCampaigns();
  };

  // ---- Google Drive import handler ----
  const handleImportFromDrive = async () => {
    setDriveError("");

    if (!driveUrl.trim()) {
      setDriveError("Paste a Google Drive share link first.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setImportingDrive(true);

    try {
      const response = await API.post(
        "/campaigns/import-drive-video",
        { driveUrl: driveUrl.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setImportedAssets((current) => [...current, response.data.mediaAsset]);
      setDriveUrl("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
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
<<<<<<< Updated upstream
    setFeedbackTone("success");
    closeResultModal();

    // at least one media source — direct upload OR a Drive import — is required
    if (!files.length && !importedAssets.length) {
      const message =
        "Upload at least one image or video, or import one from Google Drive.";
      setError(message);
      setFeedbackTone("error");
      openResultModal({
        type: "error",
        title: "Upload Required",
        message,
        details: [],
      });
      return;
    }

    if (
      !form.startDate ||
      !form.endDate ||
      !form.repeatRate ||
      !form.dailyBudgetCap
    ) {
      const message =
        "Start date, end date, repeat rate, and daily budget cap are all required.";
      setError(message);
      setFeedbackTone("error");
      openResultModal({
        type: "error",
        title: "Missing Schedule Details",
        message,
        details: [],
      });
      return;
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      const message = "End date must be after the start date.";
      setError(message);
      setFeedbackTone("error");
      openResultModal({
        type: "error",
        title: "Invalid Date Range",
        message,
        details: [],
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
=======
    setSubmitting(true);
>>>>>>> Stashed changes

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    files.forEach((file) => formData.append("mediaFiles", file));

<<<<<<< Updated upstream
    // pass along any Drive-imported assets as a JSON string —
    // the backend parses this and merges it with directly-uploaded files
    if (importedAssets.length) {
      formData.append("importedMediaAssets", JSON.stringify(importedAssets));
    }

    setSubmitting(true);

    try {
      const response = await API.post("/campaigns", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCampaigns((current) => [response.data, ...current]);
      setForm(INITIAL_FORM);
      setFiles([]);
      setImportedAssets([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const message =
        "Campaign saved as a draft. Continue to payment to send it for verification and go live.";

      setSuccess(message);
      setFeedbackTone("success");

      openResultModal({
        type: "success",
        title: "Draft Saved",
        message,
        details: [],
      });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const message =
        requestError.response?.data?.message || "Failed to save campaign.";
      setError(message);
      setFeedbackTone("error");
      openResultModal({
        type: "error",
        title: "Couldn't Save Campaign",
        message,
        details: [],
      });
=======
    try {
      if (editingId) {
        await api.patch(`/campaigns/${editingId}`, formData);
        resetForm({ clearFeedback: false });
        setSuccess("Campaign updated successfully.");
      } else {
        await api.post("/campaigns", formData);
        resetForm({ clearFeedback: false });
        setSuccess("Campaign submitted successfully.");
      }

      await loadCampaigns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save campaign.");
>>>>>>> Stashed changes
    } finally {
      setSubmitting(false);
    }
  };

  const resolveMediaUrl = (publicUrl) =>
    publicUrl?.startsWith("http") ? publicUrl : `${API_ORIGIN}${publicUrl}`;

<<<<<<< Updated upstream
  const publicCampaigns = campaigns.filter(
    (campaign) => campaign.isPublic,
  ).length;
  const blockedCampaigns = campaigns.filter(
    (campaign) => campaign.status === "rejected",
  ).length;
=======
  const publicCampaigns = campaigns.filter((campaign) => campaign.isPublic).length;
  const blockedCampaigns = campaigns.filter((campaign) => campaign.publicationStatus === "blocked").length;
>>>>>>> Stashed changes
  const totalAssets = campaigns.reduce(
    (count, campaign) => count + (campaign.mediaAssets?.length || 0),
    0,
  );

  return (
    <div className="campaigns-page">
<<<<<<< Updated upstream
      {resultModal && (
        <div className="campaigns-modal-backdrop" onClick={closeResultModal}>
          <div
            className={`campaigns-modal campaigns-modal-${resultModal.type}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-result-title"
          >
            <button
              className="campaigns-modal-close"
              type="button"
              onClick={closeResultModal}
            >
              x
            </button>
            <p className="campaigns-modal-kicker">
              {resultModal.type === "success"
                ? "Verification Complete"
                : resultModal.type === "warning"
                  ? "Manual Attention Needed"
                  : "Submission Error"}
            </p>
            <h2 id="campaign-result-title">{resultModal.title}</h2>
            <p className="campaigns-modal-message">{resultModal.message}</p>
            {!!resultModal.details?.length && (
              <ul className="campaigns-modal-list">
                {resultModal.details.map((detail, index) => (
                  <li key={`${detail}-${index}`}>{detail}</li>
                ))}
              </ul>
            )}
            <button
              className="campaigns-modal-action"
              type="button"
              onClick={closeResultModal}
            >
              Continue
            </button>
          </div>
        </div>
      )}

=======
>>>>>>> Stashed changes
      <section className="campaigns-hero">
        <div className="campaigns-hero-copy-block">
          <p className="campaigns-eyebrow">Campaign Management</p>
          <h1>Create and manage robot campaigns</h1>
          <p className="campaigns-hero-copy">
<<<<<<< Updated upstream
            Submit the campaign copy, schedule, spoken words, slide text, and
            creative files. Campaigns save as drafts, then move to payment and
            verification before going live on robot displays.
=======
            Keep your original campaign workflow, while now supporting update, delete,
            reporting, analytics, health scoring, and geo tracking behind the scenes.
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            <li>
              Campaign title, description, CTA, transcript, and slide text
            </li>
            <li>All uploaded file names, formats, and size limits</li>
            <li>Risky or inappropriate words before robot display goes live</li>
=======
            <li>CRUD campaign management with policy verification and health scoring</li>
            <li>Analytics, reports, notifications, and geo pages linked from the main nav</li>
            <li>Mock AI-ready backend endpoints for future media intelligence integrations</li>
>>>>>>> Stashed changes
          </ul>
        </div>
      </section>

      <section className="campaigns-layout">
        <form className="campaigns-form-card" onSubmit={handleSubmit}>
          <div className="campaigns-form-header">
            <div>
<<<<<<< Updated upstream
              <p className="campaigns-section-label">New Campaign</p>
              <h2>Create campaign draft</h2>
=======
              <p className="campaigns-section-label">{editingId ? "Edit Campaign" : "New Campaign"}</p>
              <h2>{editingId ? "Update campaign" : "Upload and verify"}</h2>
>>>>>>> Stashed changes
            </div>
            {editingId ? (
              <button className="campaigns-dashboard-link" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          {(error || success) && (
            <p className={`campaigns-message ${error ? "campaigns-error" : "campaigns-success"}`}>
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
            <span>
              Optional on edit. Upload up to 6 image/video files.
            </span>
          </label>

          {!!files.length && (
            <div className="campaigns-selected-files">
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`}>{file.name}</span>
              ))}
            </div>
          )}

<<<<<<< Updated upstream
          {/* ---- Google Drive video import section ---- */}
          <div className="campaigns-drive-import">
            <p className="campaigns-section-label">
              Or import a video from Google Drive
            </p>
            <div className="campaigns-drive-row">
              <input
                type="url"
                value={driveUrl}
                onChange={(event) => setDriveUrl(event.target.value)}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              />
              <button
                type="button"
                onClick={handleImportFromDrive}
                disabled={importingDrive}
                className="campaigns-drive-import-btn"
              >
                {importingDrive ? "Importing..." : "Import"}
              </button>
            </div>
            <span className="campaigns-drive-hint">
              Sharing must be set to "Anyone with the link." Works best for
              files under ~30 MB.
            </span>

            {!!driveError && (
              <p className="campaigns-message campaigns-error">{driveError}</p>
            )}

            {!!importedAssets.length && (
              <div className="campaigns-selected-files">
                {importedAssets.map((asset) => (
                  <span key={asset.storedName} className="campaigns-drive-chip">
                    Imported from Drive
                    <button
                      type="button"
                      onClick={() => removeImportedAsset(asset.storedName)}
                      aria-label="Remove imported video"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            className="campaigns-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving campaign..." : "Save as draft"}
=======
          <button className="campaigns-submit" type="submit" disabled={submitting}>
            {submitting
              ? editingId
                ? "Updating campaign..."
                : "Verifying campaign..."
              : editingId
                ? "Update campaign"
                : "Verify and publish"}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
                    <div className="campaign-card-audit">
                      <p>Checked: {dateFormatter.format(new Date(campaign.verification.checkedAt))}</p>
                      <p>Risk level: <span className="campaign-risk">{campaign.verification.riskLevel}</span></p>
                      <p>Health score: <span className="campaign-risk">{campaign.healthScore}</span></p>
                    </div>
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
                    {!!campaign.verification?.issues?.length && (
=======
                    {!!campaign.generatedInsights?.length && (
>>>>>>> Stashed changes
                      <ul className="campaign-issues">
                        {campaign.generatedInsights.map((issue, index) => (
                          <li key={`${campaign._id}-insight-${index}`}>{issue}</li>
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

                    <div className="campaign-action-row">
                      <button type="button" className="campaign-action-button" onClick={() => handleEdit(campaign)}>
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
