const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");

// ---- Route imports ----
const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const notificationRoutes = require("./routes/notifications");
const integrationRoutes = require("./routes/integrations");
const paymentRoutes = require("./routes/payments");

// admin routes
const adminCampaignRoutes = require("./routes/campaigns.admin.routes");
const adminUserRoutes = require("./routes/adminUsers");
const pricingRoutes = require("./routes/pricing");
const adminPaymentRoutes = require("./routes/admin.payments");
const adminRobotRoutes = require("./routes/admin.robots");
const adminAnalyticsRoutes = require("./routes/admin.analytics");

const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

// ---- CORS config ----
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

// ---- Sanitize helper ----
const sanitizeValue = (value) => {
  if (typeof value === "string") return value.replace(/<[^>]*>/g, "").trim();
  if (Array.isArray(value)) return value.map((entry) => sanitizeValue(entry));
  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      if (key.startsWith("$")) {
        delete value[key];
        return;
      }
      value[key] = sanitizeValue(value[key]);
    });
  }
  return value;
};

const app = express();

// ---- Security headers ----
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ---- CORS ----
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// ---- Razorpay webhook MUST come before express.json() ----
// Signature verification requires the raw body buffer, not a parsed object.
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes,
);

// ---- Body parsers ----
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ---- Sanitize req.body ----
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") sanitizeValue(req.body);
  next();
});

// ---- HTTP parameter pollution prevention ----
app.use(hpp());

// ---- Logging ----
app.use(morgan("dev"));

// ---- Global rate limiter ----
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  }),
);

// ---- Static file serving ----
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Health check ----
app.get("/api/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "ok", service: "techligence-campaign-analytics" });
});

// ---- User-facing routes ----
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/integrations", integrationRoutes);

// ---- Admin routes ----
app.use("/api/admin/campaigns", adminCampaignRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/robots", adminRobotRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
