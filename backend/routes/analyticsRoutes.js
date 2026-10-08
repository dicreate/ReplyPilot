const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get overall analytics summary
router.get("/summary", authMiddleware, analyticsController.getAnalyticsSummary);

// Get keyword performance analytics
router.get("/keywords", authMiddleware, analyticsController.getKeywordAnalytics);

// Get timeline analytics
router.get("/timeline", authMiddleware, analyticsController.getTimelineAnalytics);

// Legacy endpoint for backward compatibility
router.get("/", authMiddleware, analyticsController.getAnalytics);

module.exports = router;