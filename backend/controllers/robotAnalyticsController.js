const RobotAnalyticsSnapshot = require("../models/RobotAnalyticsSnapshot");
const RobotInteraction = require("../models/RobotInteraction");
const Robot = require("../models/Robot");

// @desc    Ingest real-time CV data from the robot
// @route   POST /api/robot-analytics/vision
// @access  Public (for robot) or Private
exports.ingestVisionData = async (req, res) => {
  try {
    const { robotId, crowdSize, density, demographics, funnel, robotHealth, currentAdDisplayed } = req.body;

    const snapshot = new RobotAnalyticsSnapshot({
      robotId,
      crowdSize,
      density,
      demographics,
      funnel,
      robotHealth,
      currentAdDisplayed,
    });

    await snapshot.save();
    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Ingest user interaction data
// @route   POST /api/robot-analytics/interaction
// @access  Public (for robot) or Private
exports.ingestInteractionData = async (req, res) => {
  try {
    const { robotId, durationSeconds, successRate, languageUsed, questions, leadGenerated, outcome } = req.body;

    const interaction = new RobotInteraction({
      robotId,
      durationSeconds,
      successRate,
      languageUsed,
      questions,
      leadGenerated,
      outcome,
    });

    await interaction.save();
    res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Dynamic Ad Decision Engine
// @route   GET /api/robot-analytics/ad-decision
// @access  Public (for robot)
exports.getAdDecision = async (req, res) => {
  try {
    const { robotId, crowdAgeAvg } = req.query;
    
    // Basic Rule-based Logic
    let selectedAd = "ad-generic-01";
    if (crowdAgeAvg && parseInt(crowdAgeAvg) > 30) {
      selectedAd = "ad-adult-02";
    } else if (crowdAgeAvg && parseInt(crowdAgeAvg) <= 30) {
      selectedAd = "ad-youth-03";
    }

    res.status(200).json({ success: true, adId: selectedAd });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Get data for Dashboard
// @route   GET /api/robot-analytics/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    // We would normally filter by robotId or user, but for now we aggregate all
    
    // Get latest snapshot for Live Status
    const latestSnapshot = await RobotAnalyticsSnapshot.findOne().sort({ timestamp: -1 });

    // Aggregate funnel data
    const snapshots = await RobotAnalyticsSnapshot.find().sort({ timestamp: -1 }).limit(100);
    const funnel = {
      footfall: 0,
      peopleLooking: 0,
      qualifiedImpressions: 0,
      approaching: 0,
      startingConversations: 0,
      questionsAsked: 0,
      qualifiedLeads: 0,
      brochureDownloads: 0,
      signups: 0,
      appointmentsBooked: 0,
      purchases: 0,
    };

    snapshots.forEach((snap) => {
      if (snap.funnel) {
        funnel.footfall += snap.funnel.footfall || 0;
        funnel.peopleLooking += snap.funnel.peopleLooking || 0;
        funnel.qualifiedImpressions += snap.funnel.qualifiedImpressions || 0;
        funnel.approaching += snap.funnel.approaching || 0;
        funnel.startingConversations += snap.funnel.startingConversations || 0;
        funnel.questionsAsked += snap.funnel.questionsAsked || 0;
        funnel.qualifiedLeads += snap.funnel.qualifiedLeads || 0;
        funnel.brochureDownloads += snap.funnel.brochureDownloads || 0;
        funnel.signups += snap.funnel.signups || 0;
        funnel.appointmentsBooked += snap.funnel.appointmentsBooked || 0;
        funnel.purchases += snap.funnel.purchases || 0;
      }
    });

    // Interaction Stats
    const interactions = await RobotInteraction.find().sort({ timestamp: -1 }).limit(100);
    let avgSuccessRate = 0;
    const questionsCategoryCount = {};
    let totalQuestions = 0;

    interactions.forEach((int) => {
      avgSuccessRate += int.successRate || 0;
      int.questions.forEach((q) => {
        const cat = q.category || "Other";
        questionsCategoryCount[cat] = (questionsCategoryCount[cat] || 0) + 1;
        totalQuestions++;
      });
    });

    if (interactions.length > 0) {
      avgSuccessRate = avgSuccessRate / interactions.length;
    }

    const aiRecommendations = [
      { type: "Improvement", message: "Increase volume slightly during high-density crowd periods to improve 'Approaching' rate." },
      { type: "Optimization", message: "Ad 'Youth-03' is performing 20% better with crowds under 30. Allocate more airtime." },
      { type: "Alert", message: "Low battery detected. Plan to route the robot to the charging station within 30 minutes." }
    ];

    res.status(200).json({
      success: true,
      data: {
        liveStatus: latestSnapshot,
        funnel,
        interactions: {
          avgSuccessRate,
          questionsCategoryCount,
          totalInteractions: interactions.length,
          totalQuestions
        },
        aiRecommendations,
        heatmapData: [
          { x: 10, y: 20, value: 50 },
          { x: 50, y: 50, value: 80 },
          { x: 70, y: 10, value: 30 }
        ]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
