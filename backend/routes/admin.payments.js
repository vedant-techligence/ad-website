const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Campaign = require("../models/Campaign.model");
const { authMiddleware } = require("../middleware/auth");
const { adminMiddleware } = require("../middleware/admin");
const Razorpay = require("razorpay");
const {
  generateInvoicePDF,
  generateInvoiceHTML,
} = require("../utils/invoiceGenerator");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// All admin payment routes require both auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);


// ─────────────────────────────────────────────
// GET /api/admin/payments/:id/invoice
// Downloads the invoice as a PDF file.
// ─────
router.get("/:id/invoice", async (req, res) => {
  try {
    console.log("1. Invoice route hit");

    const payment = await Payment.findById(req.params.id)
      .populate("advertiser", "name email businessName")
      .populate("campaign", "title brandName robotPlacement startDate endDate");

    console.log("2. Payment found");

    const pdfBuffer = await generateInvoicePDF(payment);

    console.log("3. PDF generated");
    console.log(pdfBuffer?.length);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice.pdf"`,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err);

    return res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/payments/:id/invoice/html
// Returns the invoice as an HTML page for in-browser preview.
// ─────────────────────────────────────────────
router.get("/:id/invoice/html", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("advertiser", "name email businessName")
      .populate("campaign", "title brandName robotPlacement startDate endDate");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (
      payment.status !== "paid" &&
      payment.status !== "partially_refunded" &&
      payment.status !== "refunded"
    ) {
      return res
        .status(400)
        .json({ message: "Invoice is only available for completed payments." });
    }

    const html = generateInvoiceHTML(payment);

    res.set("Content-Type", "text/html");
    return res.send(html);
  } catch (error) {
    console.error("Invoice HTML error:", error);
    return res.status(500).json({ message: "Failed to generate invoice." });
  }
});

/**
 * GET /api/admin/payments
 * List all transactions across all advertisers.
 * Supports ?status=paid&page=1&limit=20
 */
router.get("/", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("advertiser", "name email")
        .populate("campaign", "title brandName status"),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: payments,
    });
  } catch (error) {
    console.error("Admin list payments error:", error);
    return res.status(500).json({ message: "Failed to fetch payments." });
  }
});

/**
 * GET /api/admin/payments/revenue
 * Revenue summary — total revenue, total refunds, net revenue, counts by status.
 * Used for the admin dashboard home stats and revenue tracking card.
 */
router.get("/revenue", async (req, res) => {
  try {
    const summary = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const result = {
      grossRevenue: 0,
      totalRefunded: 0,
      netRevenue: 0,
      counts: {},
    };

    summary.forEach(({ _id, count, total }) => {
      result.counts[_id] = count;
      if (_id === "paid" || _id === "partially_refunded") {
        result.grossRevenue += total;
      }
      if (_id === "refunded" || _id === "partially_refunded") {
        result.totalRefunded += total;
      }
    });

    result.netRevenue = result.grossRevenue - result.totalRefunded;

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Admin revenue summary error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch revenue summary." });
  }
});

/**
 * GET /api/admin/payments/:id
 * Single payment detail including full breakdown and refund info.
 */
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("advertiser", "name email businessName")
      .populate(
        "campaign",
        "title brandName status startDate endDate repeatRate dailyBudgetCap",
      );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error("Admin get payment error:", error);
    return res.status(500).json({ message: "Failed to fetch payment." });
  }
});

/**
 * POST /api/admin/payments/:id/refund
 * Trigger a full or partial refund via Razorpay.
 * Body: { amount (optional, in paise — omit for full refund), reason }
 */
router.post("/:id/refund", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (!payment.razorpayPaymentId) {
      return res.status(400).json({
        message:
          "Cannot refund a payment that has no Razorpay payment ID — it may not have completed.",
      });
    }

    if (payment.status === "refunded") {
      return res
        .status(400)
        .json({ message: "This payment has already been fully refunded." });
    }

    const { amount, reason = "Admin-initiated refund" } = req.body;

    const refundPayload = { notes: { reason } };
    if (amount) refundPayload.amount = Number(amount);

    const refund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      refundPayload,
    );

    const isFullRefund = !amount || Number(amount) >= payment.amount;

    payment.status = isFullRefund ? "refunded" : "partially_refunded";
    payment.refund = {
      razorpayRefundId: refund.id,
      amount: refund.amount,
      reason,
      processedAt: new Date(),
      processedBy: req.user.userId,
    };

    await payment.save();

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${(refund.amount / 100).toFixed(2)} processed successfully.`,
      data: payment,
    });
  } catch (error) {
    console.error("Admin refund error:", error);
    return res.status(500).json({
      message: error?.error?.description || "Failed to process refund.",
    });
  }
});

module.exports = router;
