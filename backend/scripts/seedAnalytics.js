require("dotenv").config();

const bcrypt = require("bcryptjs");
const { connectDatabase } = require("../config/db");
const User = require("../models/User");
const { bootstrapDemoWorkspace } = require("../services/accountBootstrapService");

const rawArgs = process.argv.slice(2);
const args = {};
for (const arg of rawArgs) {
  const match = arg.match(/^--([^=]+)=(.*)$/);
  if (match) {
    args[match[1]] = match[2];
  }
}

const name = args.name || "Demo User";
const email = args.email || "demo@techligence.test";
const password = args.password || "Password123";
const businessName = args.businessName || "Techligence Ads";
const industry = args.industry || "Advertising";

(async () => {
  try {
    await connectDatabase();

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashed,
        businessName,
        industry,
        website: "https://techligence.in",
        isProfileComplete: true,
      });
      console.log("Created user:", user.email);
    } else {
      user.businessName = businessName;
      user.industry = industry;
      user.isProfileComplete = true;
      await user.save();
      console.log("Updated existing user:", user.email);
    }

    await bootstrapDemoWorkspace(user);

    console.log("Seeded analytics workspace for:", user.email);
    console.log("Password:", password);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
