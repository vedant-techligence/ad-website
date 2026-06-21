const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaign.routes");
const campaignAdminRoutes = require("./routes/campaigns.admin.routes");
const usersAdminRoutes = require("./routes/adminUsers");
const paymentRoutes = require("./routes/payments");
const adminPaymentRoutes = require("./routes/admin.payments");
const adminRobotRoutes = require("./routes/admin.robots");
const adminAnalyticsRoutes = require("./routes/admin.analytics");
const { connectDatabase } = require("./config/db");

const app = express();

// ---- Security headers ----
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ---- CORS (single registration) ----
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ---- Webhook MUST come before express.json() ----
// Razorpay signature verification needs the raw body buffer,
// not a parsed JSON object. Mounting it here with express.raw()
// before the global json parser ensures that.
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes,
);

// ---- Body parsers ----
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ---- Static file serving ----
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Sanitize req.body (NoSQL injection + XSS) ----
const sanitizeValue = (val) => {
  if (typeof val === "string") return val.replace(/<[^>]*>/g, "");
  if (typeof val === "object" && val !== null) {
    Object.keys(val).forEach((k) => {
      if (k.startsWith("$")) delete val[k];
      else val[k] = sanitizeValue(val[k]);
    });
  }
  return val;
};
app.use((req, _res, next) => {
  sanitizeValue(req.body);
  next();
});

// ---- Prevent HTTP parameter pollution ----
app.use(hpp());

// ---- Rate limiters (must be BEFORE the routes they protect) ----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payments", paymentRoutes);

// admin routes
app.use("/api/admin/campaigns", campaignAdminRoutes);
app.use("/api/admin/users", usersAdminRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/robots", adminRobotRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

// ---- Start server ----
const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

startServer();
