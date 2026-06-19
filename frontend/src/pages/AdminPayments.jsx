import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "./FeaturePages.css";

const STATUS_COLORS = {
  created: { bg: "rgba(198,126,16,0.12)", color: "#8a4f08" },
  paid: { bg: "rgba(0,168,204,0.12)", color: "#005570" },
  failed: { bg: "rgba(178,41,75,0.12)", color: "#b2294b" },
  refunded: { bg: "rgba(100,100,120,0.12)", color: "#444" },
  partially_refunded: { bg: "rgba(100,100,120,0.12)", color: "#444" },
};

const STATUS_LABELS = {
  created: "Created",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  partially_refunded: "Part. Refunded",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function AdminPayments() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [revenue, setRevenue] = useState(null);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [refundingId, setRefundingId] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundError, setRefundError] = useState("");
  const [refundSuccess, setRefundSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [token, user, navigate]);

  const fetchRevenue = async () => {
    try {
      const res = await api.get("/admin/payments/revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRevenue(res.data.data);
    } catch {
      // non-critical — revenue summary failing doesn't block the list
    }
  };

  const fetchPayments = async (currentPage, status) => {
    setLoading(true);
    setPageError("");
    try {
      const params = { page: currentPage, limit: 15 };
      if (status) params.status = status;
      const res = await api.get("/admin/payments", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setPayments(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (err.response?.status === 403) {
        setPageError(
          "Admin access required. Ask your team to assign you the admin role.",
        );
        return;
      }
      setPageError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchRevenue();
    fetchPayments(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
    fetchPayments(1, status);
  };

  const handlePageChange = (next) => {
    setPage(next);
    fetchPayments(next, statusFilter);
  };

  const openRefund = (paymentId) => {
    setRefundingId(paymentId);
    setRefundReason("");
    setRefundAmount("");
    setRefundError("");
    setRefundSuccess("");
  };

  const handleRefund = async () => {
    setRefundError("");
    setRefundSuccess("");
    try {
      const body = { reason: refundReason || "Admin-initiated refund" };
      if (refundAmount) body.amount = Math.round(Number(refundAmount) * 100); // convert ₹ to paise
      const res = await api.post(
        `/admin/payments/${refundingId}/refund`,
        body,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRefundSuccess(res.data.message);
      fetchPayments(page, statusFilter);
      fetchRevenue();
    } catch (err) {
      setRefundError(err.response?.data?.message || "Refund failed.");
    }
  };

  return (
    <div className="page-shell">
      {/* Hero */}
      <div className="feature-page-hero feature-page-card">
        <p className="feature-eyebrow">Admin</p>
        <h1 className="feature-title">Payment Transactions</h1>
        <p className="feature-copy">
          All advertiser payments across the platform. Filter by status, view
          breakdowns, and trigger refunds directly from here.
        </p>
      </div>

      {pageError && (
        <div
          className="feature-page-card"
          style={{
            marginBottom: "1rem",
            color: "var(--danger)",
            fontWeight: 600,
          }}
        >
          {pageError}
        </div>
      )}

      {/* Revenue summary */}
      {revenue && (
        <div
          className="feature-metrics-row"
          style={{ marginBottom: "1.25rem" }}
        >
          <div className="feature-metric-card">
            <span>
              {currencyFormatter.format((revenue.grossRevenue || 0) / 100)}
            </span>
            <p>Gross revenue</p>
          </div>
          <div className="feature-metric-card">
            <span>
              {currencyFormatter.format((revenue.totalRefunded || 0) / 100)}
            </span>
            <p>Total refunded</p>
          </div>
          <div className="feature-metric-card">
            <span>
              {currencyFormatter.format((revenue.netRevenue || 0) / 100)}
            </span>
            <p>Net revenue</p>
          </div>
          <div className="feature-metric-card">
            <span>{total}</span>
            <p>Total transactions</p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="feature-page-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {[
            "",
            "created",
            "paid",
            "failed",
            "refunded",
            "partially_refunded",
          ].map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "999px",
                border: "1px solid rgba(0,85,204,0.2)",
                background:
                  statusFilter === s ? "var(--accent-blue)" : "transparent",
                color: statusFilter === s ? "#fff" : "var(--text-secondary)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {s ? STATUS_LABELS[s] : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Payments list */}
      <div className="feature-page-card">
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>
            Loading transactions...
          </p>
        ) : payments.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>
            No transactions found.
          </p>
        ) : (
          <div className="feature-table-list">
            {payments.map((payment) => {
              const tone = STATUS_COLORS[payment.status] || {};
              return (
                <div
                  className="feature-table-row"
                  key={payment._id}
                  style={{ padding: "1rem 1.1rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-heading)",
                          color: "var(--text-primary)",
                          fontSize: "0.95rem",
                        }}
                      >
                        {payment.campaign?.title || "—"}
                      </p>
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.88rem",
                          marginTop: "0.2rem",
                        }}
                      >
                        {payment.advertiser?.name} · {payment.advertiser?.email}
                      </p>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                          marginTop: "0.15rem",
                        }}
                      >
                        {payment.razorpayOrderId} ·{" "}
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "1rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        {currencyFormatter.format((payment.amount || 0) / 100)}
                      </span>
                      <span
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-heading)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          background: tone.bg,
                          color: tone.color,
                        }}
                      >
                        {STATUS_LABELS[payment.status] || payment.status}
                      </span>
                      {payment.status === "paid" && (
                        <button
                          onClick={() => openRefund(payment._id)}
                          style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "12px",
                            border: "1px solid rgba(178,41,75,0.3)",
                            background: "rgba(178,41,75,0.08)",
                            color: "var(--danger)",
                            fontFamily: "var(--font-heading)",
                            fontSize: "0.75rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline refund panel */}
                  {refundingId === payment._id && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        borderRadius: "16px",
                        background: "rgba(178,41,75,0.06)",
                        border: "1px solid rgba(178,41,75,0.15)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontSize: "0.82rem",
                          color: "var(--danger)",
                          marginBottom: "0.75rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Issue Refund
                      </p>
                      <div style={{ display: "grid", gap: "0.6rem" }}>
                        <input
                          placeholder="Reason (optional)"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          style={{
                            padding: "0.65rem 0.85rem",
                            borderRadius: "12px",
                            border: "1px solid rgba(0,85,204,0.12)",
                            background: "#fff",
                            color: "var(--text-primary)",
                            fontSize: "0.95rem",
                          }}
                        />
                        <input
                          type="number"
                          placeholder={`Amount in ₹ (leave blank for full refund of ${currencyFormatter.format(payment.amount / 100)})`}
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          style={{
                            padding: "0.65rem 0.85rem",
                            borderRadius: "12px",
                            border: "1px solid rgba(0,85,204,0.12)",
                            background: "#fff",
                            color: "var(--text-primary)",
                            fontSize: "0.95rem",
                          }}
                        />
                        {refundError && (
                          <p
                            style={{
                              color: "var(--danger)",
                              fontSize: "0.88rem",
                            }}
                          >
                            {refundError}
                          </p>
                        )}
                        {refundSuccess && (
                          <p
                            style={{
                              color: "var(--success)",
                              fontSize: "0.88rem",
                            }}
                          >
                            {refundSuccess}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "0.6rem" }}>
                          <button
                            onClick={handleRefund}
                            style={{
                              flex: 1,
                              padding: "0.7rem",
                              borderRadius: "12px",
                              border: "none",
                              background: "var(--danger)",
                              color: "#fff",
                              fontFamily: "var(--font-heading)",
                              fontSize: "0.8rem",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              cursor: "pointer",
                            }}
                          >
                            Confirm refund
                          </button>
                          <button
                            onClick={() => setRefundingId(null)}
                            style={{
                              padding: "0.7rem 1rem",
                              borderRadius: "12px",
                              border: "1px solid rgba(0,85,204,0.15)",
                              background: "transparent",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              fontFamily: "var(--font-heading)",
                              fontSize: "0.8rem",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "1.25rem",
            }}
          >
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "12px",
                border: "1px solid rgba(0,85,204,0.2)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <span
              style={{
                padding: "0.5rem 1rem",
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
              }}
            >
              Page {page} of {pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pages}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "12px",
                border: "1px solid rgba(0,85,204,0.2)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: page === pages ? "not-allowed" : "pointer",
                opacity: page === pages ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPayments;
