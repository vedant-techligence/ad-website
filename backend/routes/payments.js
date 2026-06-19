const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Campaign = require("../models/Campaign.model");
const { authMiddleware } = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---- Pricing config — swap real values in here once finalized ----
const PRICING = {
  baseRatePerDay: 150, // ₹150 per day base rate
  repeatRateMultiplier: (rate) => 1 + (rate - 1) * 0.1, // e.g. 3x/day = 1.2x cost
  platformFee: 500, // flat ₹500 platform fee
  gstRate: 0.18, // 18% GST
};

const calculateCost = (startDate, endDate, repeatRate) => {
  const days = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
  );
  const multiplier = PRICING.repeatRateMultiplier(Number(repeatRate));
  const base = PRICING.baseRatePerDay * days * multiplier;
  const platformFee = PRICING.platformFee;
  const subtotal = base + platformFee;
  const gstAmount = subtotal * PRICING.gstRate;
  const total = Math.round((subtotal + gstAmount) * 100) / 100; // rounded to paise

  return {
    durationDays: days,
    baseRate: PRICING.baseRatePerDay,
    repeatRateMultiplier: multiplier,
    platformFee,
    gstAmount: Math.round(gstAmount * 100) / 100,
    total,
    totalInPaise: Math.round(total * 100), // Razorpay expects paise
  };
};

/**
 * GET /api/payments/estimate/:campaignId
 * Returns the cost breakdown for a campaign before the advertiser pays.
 * Called by the frontend to show the payment summary screen.
 */
router.get("/estimate/:campaignId", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.campaignId,
      owner: req.user.userId,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    if (campaign.status !== "draft") {
      return res.status(400).json({
        message: `Campaign is already in '${campaign.status}' status — cannot re-estimate.`,
      });
    }

    const estimate = calculateCost(
      campaign.startDate,
      campaign.endDate,
      campaign.repeatRate,
    );

    // store the estimate on the campaign so the final charged amount
    // matches what was shown at review time
    campaign.estimatedCost = estimate.total;
    await campaign.save();

    return res.status(200).json({ success: true, data: estimate });
  } catch (error) {
    console.error("Estimate error:", error);
    return res.status(500).json({ message: "Failed to calculate estimate." });
  }
});

/**
 * POST /api/payments/create-order/:campaignId
 * Creates a Razorpay order for the campaign.
 * Frontend opens Razorpay checkout with the returned order_id.
 */
router.post("/create-order/:campaignId", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.campaignId,
      owner: req.user.userId,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    if (campaign.status !== "draft") {
      return res.status(400).json({
        message: `Campaign is already in '${campaign.status}' status.`,
      });
    }

    // always recalculate server-side — never trust a price from the client
    const estimate = calculateCost(
      campaign.startDate,
      campaign.endDate,
      campaign.repeatRate,
    );

    const order = await razorpay.orders.create({
      amount: estimate.totalInPaise,
      currency: "INR",
      receipt: campaign._id.toString(),
      notes: {
        campaignId: campaign._id.toString(),
        campaignTitle: campaign.title,
        advertiserId: req.user.userId,
      },
    });

    // persist the payment record with status "created"
    const payment = await Payment.create({
      campaign: campaign._id,
      advertiser: req.user.userId,
      razorpayOrderId: order.id,
      amount: estimate.totalInPaise,
      currency: "INR",
      breakdown: {
        baseRate: estimate.baseRate,
        durationDays: estimate.durationDays,
        repeatRateMultiplier: estimate.repeatRateMultiplier,
        platformFee: estimate.platformFee,
        gstAmount: estimate.gstAmount,
      },
      status: "created",
    });

    // flip campaign to pending_payment so it can't get re-ordered
    campaign.status = "pending_payment";
    campaign.estimatedCost = estimate.total;
    await campaign.save();

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: estimate.totalInPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this to open the checkout widget
        paymentId: payment._id,
        estimate,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ message: "Failed to create payment order." });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook — called by Razorpay when payment completes or fails.
 * CRITICAL: This is the only place we trust payment confirmation.
 * Never mark a campaign as paid from the frontend success callback alone.
 *
 * Set this URL in your Razorpay dashboard under Webhooks:
 * https://your-domain.com/api/payments/webhook
 * Active events: payment.captured, payment.failed
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      // verify the request actually came from Razorpay
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.warn(
          "Razorpay webhook: invalid signature — possible spoofed request.",
        );
        return res.status(400).json({ message: "Invalid signature." });
      }

      const event = JSON.parse(req.body);
      const { event: eventType, payload } = event;

      if (eventType === "payment.captured") {
        const rzpPayment = payload.payment.entity;

        const payment = await Payment.findOne({
          razorpayOrderId: rzpPayment.order_id,
        });

        if (!payment) {
          console.error(
            "Webhook: no payment record found for order",
            rzpPayment.order_id,
          );
          return res.status(200).json({ received: true }); // still 200 so Razorpay doesn't retry endlessly
        }

        // generate a simple invoice number — prefix + padded id
        const invoiceNumber = `INV-${Date.now()}-${payment._id.toString().slice(-6).toUpperCase()}`;

        payment.status = "paid";
        payment.razorpayPaymentId = rzpPayment.id;
        payment.razorpaySignature = signature;
        payment.invoiceNumber = invoiceNumber;
        await payment.save();

        // flip the campaign into the verification queue
        await Campaign.findByIdAndUpdate(payment.campaign, {
          status: "paid_pending_verification",
        });

        console.log(
          `Payment ${payment._id} confirmed. Campaign ${payment.campaign} → paid_pending_verification.`,
        );
      }

      if (eventType === "payment.failed") {
        const rzpPayment = payload.payment.entity;

        await Payment.findOneAndUpdate(
          { razorpayOrderId: rzpPayment.order_id },
          { status: "failed" },
        );

        // revert campaign back to draft so advertiser can retry
        const payment = await Payment.findOne({
          razorpayOrderId: rzpPayment.order_id,
        });
        if (payment) {
          await Campaign.findByIdAndUpdate(payment.campaign, {
            status: "draft",
          });
        }

        console.log("Payment failed for order:", rzpPayment.order_id);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return res.status(500).json({ message: "Webhook processing failed." });
    }
  },
);

module.exports = router;
