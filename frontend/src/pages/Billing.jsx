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

const BILLABLE_STATUSES = new Set(["pending_payment"]);

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatDate = (isoString) => (isoString ? isoString.slice(0, 10) : "—");

// Loads the Razorpay checkout script once and resolves when ready.
// Safe to call multiple times — returns immediately if already loaded.
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Billing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [payingId, setPayingId] = useState(null); // campaign._id currently being paid
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

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

  const handleProceedToPayment = async (campaign) => {
    setPaymentError("");
    setPaymentSuccess("");
    setPayingId(campaign._id);

    try {
      // Step 1 — load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentError(
          "Failed to load payment gateway. Check your connection and try again.",
        );
        return;
      }

      // Step 2 — create Razorpay order on backend
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.post(
        `/payments/create-order/${campaign._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const { orderId, amount, currency, keyId } = response.data.data;

      // Step 3 — open Razorpay checkout widget
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Techligence Ads",
        description: `Payment for: ${campaign.title}`,
        order_id: orderId,

        // Called by Razorpay after the user completes payment in the widget.
        // IMPORTANT: Do NOT mark the campaign as paid here — the webhook does
        // that. This handler is only for user-facing feedback.
        handler: function () {
          setPaymentSuccess(
            `Payment submitted for "${campaign.title}". Your campaign will move to verification once payment is confirmed.`,
          );
          // Refresh the campaign list after a short delay so the status
          // update from the webhook has time to propagate.
          setTimeout(async () => {
            try {
              const refreshed = await API.get("/campaigns", {
                headers: { Authorization: `Bearer ${token}` },
              });
              setCampaigns(refreshed.data.items || []);
            } catch {
              // Non-critical — user can refresh manually
            }
          }, 3000);
        },

        prefill: {
          // Razorpay can pre-fill contact details if provided.
          // These are optional — leave blank for now.
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#005cd6",
        },

        modal: {
          ondismiss: () => {
            // User closed the widget without paying — reset the button.
            setPayingId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        setPaymentError(
          `Payment failed: ${response.error.description}. Please try again.`,
        );
        setPayingId(null);
      });

      rzp.open();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (requestError.response?.status === 400) {
        // Campaign already in pending_payment or beyond — refresh list
        setPaymentError(requestError.response.data.message);
        const token = localStorage.getItem("token");
        if (token) {
          const refreshed = await API.get("/campaigns", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
          if (refreshed) setCampaigns(refreshed.data.items || []);
        }
      } else {
        setPaymentError(
          requestError.response?.data?.message ||
            "Failed to initiate payment. Please try again.",
        );
      }
    } finally {
      // Only clear payingId if Razorpay widget didn't open
      // (if it opened, ondismiss or handler clears it)
      if (!window.Razorpay) setPayingId(null);
    }
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
      {paymentError && <p className="billing-page-error">{paymentError}</p>}
      {paymentSuccess && (
        <p className="billing-page-success">{paymentSuccess}</p>
      )}

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
                    onClick={() => handleProceedToPayment(campaign)}
                    disabled={payingId === campaign._id}
                  >
                    {payingId === campaign._id
                      ? "Opening payment..."
                      : "Proceed to payment"}
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
                  <span>Amount paid</span>
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