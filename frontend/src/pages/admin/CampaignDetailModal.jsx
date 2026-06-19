import { API_ORIGIN } from "../../api/axios";

const STATUS_ACTIONS = {
  paid_pending_verification: ["approve", "reject"],
  public: ["pause"],
  paused: ["approve"],
};

const formatStatus = (s) => s.replace(/_/g, " ");
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

const resolveMediaUrl = (url) =>
  /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`;

function CampaignDetailModal({ campaign, loading, error, onClose, onAction }) {
  const actions = campaign ? STATUS_ACTIONS[campaign.status] || [] : [];

  return (
    <div className="admin-campaign-modal__overlay" onClick={onClose}>
      <div
        className="admin-campaign-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="admin-campaign-modal__close" onClick={onClose}>
          ×
        </button>

        {loading && (
          <p className="admin-campaigns__status">Loading details...</p>
        )}
        {error && <p className="admin-campaigns__error">{error}</p>}

        {campaign && !loading && (
          <>
            <h3 className="admin-campaign-modal__title">{campaign.title}</h3>
            <span
              className={`admin-campaigns__badge admin-campaigns__badge--${campaign.status}`}
            >
              {formatStatus(campaign.status)}
            </span>

            <div className="admin-campaign-modal__section">
              <h4>Brand & Owner</h4>
              <p>
                <strong>Brand:</strong> {campaign.brandName}
              </p>
              <p>
                <strong>Owner:</strong> {campaign.owner?.name} (
                {campaign.owner?.email})
              </p>
              <p>
                <strong>Robot Placement:</strong> {campaign.robotPlacement}
              </p>
              {campaign.destinationUrl && (
                <p>
                  <strong>Destination:</strong>{" "}
                  <a
                    href={campaign.destinationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {campaign.destinationUrl}
                  </a>
                </p>
              )}
            </div>

            <div className="admin-campaign-modal__section">
              <h4>Ad Content</h4>
              <p>{campaign.description}</p>
              {campaign.callToAction && (
                <p>
                  <strong>CTA:</strong> {campaign.callToAction}
                </p>
              )}
              {campaign.spokenWords && (
                <p>
                  <strong>Spoken Words:</strong> {campaign.spokenWords}
                </p>
              )}
              {campaign.slideText && (
                <p>
                  <strong>Slide Text:</strong> {campaign.slideText}
                </p>
              )}
            </div>

            <div className="admin-campaign-modal__section">
              <h4>Media</h4>
              {campaign.mediaAssets?.length ? (
                <div className="admin-campaign-modal__media-grid">
                  {campaign.mediaAssets.map((m) =>
                    m.kind === "video" ? (
                      <video
                        key={m.storedName}
                        className="admin-campaign-modal__media-item"
                        src={resolveMediaUrl(m.publicUrl)}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        key={m.storedName}
                        className="admin-campaign-modal__media-item"
                        src={resolveMediaUrl(m.publicUrl)}
                        alt={m.originalName}
                      />
                    ),
                  )}
                </div>
              ) : (
                <p>No media uploaded.</p>
              )}
            </div>

            <div className="admin-campaign-modal__section">
              <h4>Targeting</h4>
              <p>
                <strong>Locations:</strong>{" "}
                {campaign.targeting?.locations?.join(", ") || "Any"}
              </p>
              <p>
                <strong>Age Range:</strong> {campaign.targeting?.ageRange?.min}–
                {campaign.targeting?.ageRange?.max}
              </p>
              <p>
                <strong>Gender:</strong> {campaign.targeting?.gender}
              </p>
              <p>
                <strong>Interests:</strong>{" "}
                {campaign.targeting?.interests?.join(", ") || "Any"}
              </p>
            </div>

            <div className="admin-campaign-modal__section">
              <h4>Schedule & Budget</h4>
              <p>
                <strong>Start:</strong> {formatDate(campaign.startDate)}
              </p>
              <p>
                <strong>End:</strong> {formatDate(campaign.endDate)}
              </p>
              <p>
                <strong>Repeat Rate:</strong> {campaign.repeatRate}/day
              </p>
              <p>
                <strong>Daily Budget Cap:</strong> ₹
                {campaign.dailyBudgetCap?.toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Estimated Cost:</strong> ₹
                {campaign.estimatedCost?.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="admin-campaign-modal__section">
              <h4>Verification</h4>
              <p>
                <strong>Status:</strong> {campaign.verification?.status}
              </p>
              {campaign.verification?.riskLevel && (
                <p>
                  <strong>Risk Level:</strong> {campaign.verification.riskLevel}
                </p>
              )}
              {campaign.verification?.flaggedTerms?.length > 0 && (
                <p>
                  <strong>Flagged Terms:</strong>{" "}
                  {campaign.verification.flaggedTerms.join(", ")}
                </p>
              )}
              {campaign.verification?.issues?.length > 0 && (
                <p>
                  <strong>Issues:</strong>{" "}
                  {campaign.verification.issues.join(", ")}
                </p>
              )}
              {campaign.verification?.checksSummary && (
                <p>
                  <strong>Summary:</strong>{" "}
                  {campaign.verification.checksSummary}
                </p>
              )}
            </div>

            <div className="admin-campaign-modal__actions">
              {actions.map((action) => (
                <button
                  key={action}
                  className={`admin-campaigns__action-btn admin-campaigns__action-btn--${action}`}
                  onClick={() => onAction(action)}
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              ))}
              {!actions.length && (
                <p className="admin-campaigns__no-action">
                  No actions available for this status.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CampaignDetailModal;
