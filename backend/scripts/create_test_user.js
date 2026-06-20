require("dotenv").config();
const { connectDatabase } = require("../config/db");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const rawArgs = process.argv.slice(2);
const args = {};
for (const arg of rawArgs) {
  const match = arg.match(/^--([^=]+)=(.*)$/);
  if (match) args[match[1]] = match[2];
}
const name = args.name || "Demo User";
const email = args.email || "demo@techligence.test";
const password = args.password || "Password123";

const signToken = (user) =>
  jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

(async () => {
  try {
    await connectDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log("User already exists:", existing.email);
      console.log("Token:", signToken(existing));
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    console.log("Created user:", user.email);
    console.log("Password:", password);
    console.log("Token:", signToken(user));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
