const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });
const RobotAnalyticsSnapshot = require("../models/RobotAnalyticsSnapshot");
const RobotInteraction = require("../models/RobotInteraction");
const Robot = require("../models/Robot");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Try to get a robot, or mock a robotId
    let robot = await Robot.findOne();
    let robotId = robot ? robot._id : new mongoose.Types.ObjectId();

    console.log("Clearing old robot data...");
    await RobotAnalyticsSnapshot.deleteMany({});
    await RobotInteraction.deleteMany({});

    console.log("Seeding Robot Analytics Snapshots...");
    for (let i = 0; i < 20; i++) {
      await RobotAnalyticsSnapshot.create({
        robotId,
        crowdSize: Math.floor(Math.random() * 50) + 10,
        density: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
        demographics: {
          ageGroups: { children: 5, youngAdults: 20, adults: 15, seniors: 2 },
          gender: { male: 20, female: 22, other: 0 }
        },
        funnel: {
          footfall: 100 + i * 10,
          peopleLooking: 60 + i * 5,
          qualifiedImpressions: 40 + i * 3,
          approaching: 20 + i * 2,
          startingConversations: 10 + i,
          questionsAsked: 15 + i,
          qualifiedLeads: 5,
          brochureDownloads: 3,
          signups: 2,
          appointmentsBooked: 1,
          purchases: 0
        },
        robotHealth: {
          batteryLevel: 100 - i * 2,
          connectivityStatus: "Online",
          gpsLocation: { lat: 40.7128, lng: -74.0060 }
        },
        currentAdDisplayed: `ad-mock-0${(i % 3) + 1}`,
        timestamp: new Date(Date.now() - i * 60000)
      });
    }

    console.log("Seeding Robot Interactions...");
    const categories = ["Product Information", "Pricing", "Availability", "Booking", "Warranty", "Admissions", "Discounts", "Other"];
    for (let i = 0; i < 30; i++) {
      await RobotInteraction.create({
        robotId,
        durationSeconds: Math.floor(Math.random() * 120) + 10,
        successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        languageUsed: "English",
        questions: [
          { text: "What is this?", category: categories[Math.floor(Math.random() * categories.length)] },
          { text: "How much?", category: categories[Math.floor(Math.random() * categories.length)] }
        ],
        leadGenerated: Math.random() > 0.8,
        outcome: ["Brochure Download", "Signup", "None"][Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - i * 30000)
      });
    }

    console.log("Seed complete.");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
