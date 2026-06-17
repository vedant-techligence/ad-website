import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { API_ORIGIN } from "../api/axios";
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
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function Campaigns() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");
  const [resultModal, setResultModal] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const loadCampaigns = async () => {
      try {
        const response = await API.get("/campaigns", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCampaigns(response.data);
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        setError("Unable to load campaigns right now.");
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const openResultModal = (payload) => {
    setResultModal(payload);
  };

  const closeResultModal = () => {
    setResultModal(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFeedbackTone("success");
    closeResultModal();

    if (!files.length) {
      const message = "Upload at least one image or video for the campaign.";
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

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    files.forEach((file) => formData.append("mediaFiles", file));

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const wasApproved = response.data.verification?.status === "approved";
      const message = wasApproved
        ? "Campaign verified and published for robot display."
        : "Campaign submitted but blocked by automated verification.";
      const details = [
        ...new Set([
          ...(response.data.verification?.flaggedTerms || []).map((term) => `Flagged word: ${term}`),
          ...(response.data.verification?.issues || []),
        ]),
      ];

      setSuccess(message);
      setFeedbackTone(wasApproved ? "success" : "warning");
      openResultModal({
        type: wasApproved ? "success" : "warning",
        title: wasApproved ? "Campaign Is Now Public" : "Campaign Blocked",
        message,
        details,
      });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const message = requestError.response?.data?.message || "Failed to submit campaign.";
      setError(message);
      setFeedbackTone("error");
      openResultModal({
        type: "error",
        title: "Verification Failed",
        message,
        details: [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resolveMediaUrl = (publicUrl) =>
    publicUrl?.startsWith("http") ? publicUrl : `${API_ORIGIN}${publicUrl}`;

  const publicCampaigns = campaigns.filter((campaign) => campaign.isPublic).length;
  const blockedCampaigns = campaigns.filter((campaign) => campaign.status === "rejected").length;
  const totalAssets = campaigns.reduce(
    (count, campaign) => count + (campaign.mediaAssets?.length || 0),
    0,
  );

  return (
    <div className="campaigns-page">
      {resultModal && (
        <div className="campaigns-modal-backdrop" onClick={closeResultModal}>
          <div
            className={`campaigns-modal campaigns-modal-${resultModal.type}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-result-title"
          >
            <button className="campaigns-modal-close" type="button" onClick={closeResultModal}>
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
            <button className="campaigns-modal-action" type="button" onClick={closeResultModal}>
              Continue
            </button>
          </div>
        </div>
      )}

      <section className="campaigns-hero">
        <div className="campaigns-hero-copy-block">
          <p className="campaigns-eyebrow">Ad Verification Control</p>
          <h1>Create Robot-Safe Campaigns</h1>
          <p className="campaigns-hero-copy">
            Submit the campaign copy, spoken words, slide text, and creative files.
            Safe campaigns go public automatically after verification.
          </p>
          <div className="campaigns-stat-row">
            <div className="campaigns-stat-card">
              <span>{publicCampaigns}</span>
              <p>Public campaigns</p>
            </div>
            <div className="campaigns-stat-card">
              <span>{blockedCampaigns}</span>
              <p>Blocked by policy</p>
            </div>
            <div className="campaigns-stat-card">
              <span>{totalAssets}</span>
              <p>Media files reviewed</p>
            </div>
          </div>
        </div>
        <div className="campaigns-hero-panel">
          <h2>What gets checked</h2>
          <ul>
            <li>Campaign title, description, CTA, transcript, and slide text</li>
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
              <h2>Upload and verify</h2>
            </div>
            <Link className="campaigns-dashboard-link" to="/dashboard">
              Back to dashboard
            </Link>
          </div>

          {(error || success) && (
            <p
              className={`campaigns-message ${
                error
                  ? "campaigns-error"
                  : feedbackTone === "warning"
                    ? "campaigns-warning"
                    : "campaigns-success"
              }`}
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
              required
            />
          </label>

          <label>
            On-screen slide or visual text
            <textarea
              name="slideText"
              value={form.slideText}
              onChange={handleChange}
              placeholder="List the slide text, subtitles, overlays, or text visible in the creative."
              rows="4"
              required
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
              Up to 6 image/video files. Images max 10 MB. Videos max 80 MB.
            </span>
          </label>

          {!!files.length && (
            <div className="campaigns-selected-files">
              {files.map((file) => (
                <span key={`${file.name}-${file.size}`}>{file.name}</span>
              ))}
            </div>
          )}

          <button className="campaigns-submit" type="submit" disabled={submitting}>
            {submitting ? "Verifying campaign..." : "Verify and publish"}
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
                const isApproved = campaign.verification?.status === "approved";

                return (
                  <article className="campaign-card" key={campaign._id}>
                    <div className="campaign-card-top">
                      <div>
                        <p className="campaign-card-title">{campaign.title}</p>
                        <p className="campaign-card-meta">
                          {campaign.brandName} • {campaign.robotPlacement}
                        </p>
                      </div>
                      <span
                        className={`campaign-badge ${
                          isApproved ? "campaign-badge-public" : "campaign-badge-rejected"
                        }`}
                      >
                        {isApproved ? "Public" : "Blocked"}
                      </span>
                    </div>

                    <p className="campaign-card-copy">{campaign.description}</p>

                    <div className="campaign-card-audit">
                      <p>
                        Checked: {dateFormatter.format(new Date(campaign.verification.checkedAt))}
                      </p>
                      <p>
                        Risk level:{" "}
                        <span className="campaign-risk">{campaign.verification.riskLevel}</span>
                      </p>
                      <p>{campaign.verification.checksSummary}</p>
                    </div>

                    {!!campaign.verification.flaggedTerms?.length && (
                      <div className="campaign-chip-group">
                        {campaign.verification.flaggedTerms.map((term) => (
                          <span className="campaign-chip campaign-chip-alert" key={term}>
                            {term}
                          </span>
                        ))}
                      </div>
                    )}

                    {!!campaign.verification.issues?.length && (
                      <ul className="campaign-issues">
                        {campaign.verification.issues.map((issue, index) => (
                          <li key={`${campaign._id}-${index}`}>{issue}</li>
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
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="campaigns-empty">
              No campaigns yet. Your approved uploads will appear here as public-ready robot ads.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Campaigns;
