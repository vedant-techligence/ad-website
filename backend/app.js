const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const notificationRoutes = require("./routes/notifications");
const integrationRoutes = require("./routes/integrations");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

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

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeValue(req.body);
  }
  next();
});
app.use(hpp());
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  }),
);
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Try again soon." },
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "techligence-campaign-analytics" });
});

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/integrations", integrationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
