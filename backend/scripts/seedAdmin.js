require("dotenv").config();
const mongoose = require("mongoose");
const { connectDatabase } = require("../config/db");
const User = require("../models/User");

const run = async () => {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME || "Admin";

  if (!email || !password) {
    console.error(
      "Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in backend/.env",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_SEED_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await connectDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === "admin") {
      console.log(`User ${email} is already an admin. Nothing to do.`);
    } else {
      existing.role = "admin";
      await existing.save();
      console.log(`Existing user ${email} promoted to admin.`);
      console.warn(
        "Warning: existing password was retained. Verify it meets your security requirements.",
      );
    }
  } else {
    await User.create({ name, email, password, role: "admin" });
    console.log(`Admin user ${email} created.`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});