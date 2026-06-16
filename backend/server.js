const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
require("dotenv").config();

const authRoutes = require("./routes/auth");

const app = express();

// Security headers
app.use(helmet());

// Restrict CORS to frontend origin only
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Body parser with size limit
app.use(express.json({ limit: "10kb" }));

// Sanitize req.body: strip $ keys (NoSQL injection) and HTML tags (XSS)
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
app.use((req, _res, next) => { sanitizeValue(req.body); next(); });

// Prevent HTTP parameter pollution
app.use(hpp());

// Global rate limit — 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict rate limit for auth routes — 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("DB connection error:", err));
