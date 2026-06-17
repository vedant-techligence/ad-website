import "./config/env.js";

import express from "express";
import mongoose from "mongoose";
import campaign from "./routes/campaign.routes.js";

const app = express();

app.use(express.json());
console.log("Mongo URI:", process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });

app.get("/", (req, res) => {
  res.send("Ads Platform API Running");
});

app.use("/api/campaigns", campaign);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
