import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/useAuth";
import "./Billing.css";

const STATUS_LABELS = {
  draft: "Draft",
  pending_payment: "Awaiting payment",
  paid_pending_verification: "In verification",
  public: "Public",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

const BILLABLE_STATUSES = new Set(["draft", "pending_payment"]);

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatDate = (isoString) => (isoString ? isoString.slice(0, 10) : "—");

function Billing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const loadCampaigns = async () => {
      try {
        const response = await API.get("/campaigns");
        setCampaigns(response.data.items || []);
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          navigate("/login");
          return;
        }
        setPageError("Unable to load campaigns right now.");
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [authLoading, user, navigate]);

  const handleProceedToPayment = () => {
    // Razorpay checkout isn't built yet — this is wired up but intentionally
    // a no-op for now so the button doesn't silently fail or 404.
  };

  const billableCampaigns = campaigns.filter((campaign) =>
    BILLABLE_STATUSES.has(campaign.status),
  );
  const resolvedCampaigns = campaigns.filter(
    (campaign) => !BILLABLE_STATUSES.has(campaign.status),
  );

  const totalDue = billableCampaigns.reduce(
    (sum, campaign) => sum + (campaign.estimatedCost || 0),
    0,
  );

  return (
    <div className="billing-page">
      <section className="billing-hero">
        <p className="billing-eyebrow">Ad Verification Control</p>
        <h1>Billing</h1>
        <p className="billing-hero-copy">
          Every draft campaign&apos;s cost is calculated and locked in at
          creation. Complete payment below to send it for verification.
        </p>
        <div className="billing-stat-row">
          <div className="billing-stat-card">
            <span>{billableCampaigns.length}</span>
            <p>Awaiting payment</p>
          </div>
          <div className="billing-stat-card">
            <span>{currencyFormatter.format(totalDue)}</span>
            <p>Total due</p>
          </div>
        </div>
      </section>

      {pageError && <p className="billing-page-error">{pageError}</p>}

      <section className="billing-list-card">
        <div className="billing-section-header">
          <p className="billing-section-label">Needs Payment</p>
          <h2>Draft &amp; pending campaigns</h2>
        </div>

        {loading ? (
          <p className="billing-empty">Loading campaigns...</p>
        ) : billableCampaigns.length ? (
          <div className="billing-list">
            {billableCampaigns.map((campaign) => (
              <article className="billing-item" key={campaign._id}>
                <div className="billing-item-top">
                  <div>
                    <p className="billing-item-title">{campaign.title}</p>
                    <p className="billing-item-meta">
                      {campaign.brandName} • {campaign.robotPlacement}
                    </p>
                  </div>
                  <span className="billing-badge">
                    {STATUS_LABELS[campaign.status] || campaign.status}
                  </span>
                </div>

                <div className="billing-item-schedule">
                  <span>
                    {formatDate(campaign.startDate)} →{" "}
                    {formatDate(campaign.endDate)}
                  </span>
                  <span>{campaign.repeatRate}x/day</span>
                  <span>
                    Cap:{" "}
                    {currencyFormatter.format(campaign.dailyBudgetCap || 0)}/day
                  </span>
                </div>

                <div className="billing-breakdown-row billing-breakdown-total">
                  <span>Final cost</span>
                  <span>
                    {currencyFormatter.format(campaign.estimatedCost || 0)}
                  </span>
                </div>

                <div className="billing-item-actions">
                  <button
                    className="billing-primary-button"
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled
                    title="Payment integration is coming soon"
                  >
                    Proceed to payment
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="billing-empty">
            Nothing waiting on payment right now.{" "}
            <Link to="/campaigns">Create a campaign</Link> to get started.
          </p>
        )}
      </section>

      {!!resolvedCampaigns.length && (
        <section className="billing-list-card">
          <div className="billing-section-header">
            <p className="billing-section-label">Payment History</p>
            <h2>Paid &amp; resolved campaigns</h2>
          </div>
          <div className="billing-list">
            {resolvedCampaigns.map((campaign) => (
              <article
                className="billing-item billing-item-locked"
                key={campaign._id}
              >
                <div className="billing-item-top">
                  <div>
                    <p className="billing-item-title">{campaign.title}</p>
                    <p className="billing-item-meta">
                      {campaign.brandName} • {campaign.robotPlacement}
                    </p>
                  </div>
                  <span className="billing-badge">
                    {STATUS_LABELS[campaign.status] || campaign.status}
                  </span>
                </div>
                <div className="billing-breakdown-row billing-breakdown-total">
                  <span>Locked-in amount</span>
                  <span>
                    {currencyFormatter.format(campaign.estimatedCost || 0)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Billing;
