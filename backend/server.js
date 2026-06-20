require("dotenv").config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaign.routes");
const campaignAdminRoutes = require("./routes/campaigns.admin.routes");
const usersAdminRoutes = require("./routes/adminUsers");
const testRoutes =require("./routes/test.routes");
const { connectDatabase } = require("./config/db");
require("./jobs/cron");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/test", testRoutes);
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

app.use(hpp());

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

app.use("/api/admin/campaigns", campaignAdminRoutes);
app.use("/api/admin/users", usersAdminRoutes);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);

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