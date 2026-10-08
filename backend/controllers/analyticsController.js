const mongoose = require("mongoose");
const Analytics = require("../models/Analytics");
const Keyword = require("../models/Keyword");
const ProcessedComment = require("../models/ProcessedComment");
const logger = require("../utils/logger");
const cacheService = require("../services/cacheService");

// aggregate() НЕ кастит строку в ObjectId в $match (проверено: find находит,
// aggregate со строкой — нет), поэтому приводим явно. Иначе вся аналитика
// всегда возвращала нули.
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Get overall analytics summary
exports.getAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Check cache first
    const cacheKey = cacheService.generateAnalyticsKey(userId, 'summary', days);
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get aggregated analytics for the period
    const analyticsData = await Analytics.aggregate([
      {
        $match: {
          userId: toObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalDmsSent: { $sum: "$dmsSent" },
          totalCommentsProcessed: { $sum: "$commentsProcessed" },
          totalKeywordMatches: { $sum: "$keywordMatches" },
          totalErrors: { $sum: "$errorCount" },
          avgProcessingTime: { $avg: "$processingTime" },
          daysWithActivity: { $sum: 1 }
        }
      }
    ]);

    const summary = analyticsData.length > 0 ? analyticsData[0] : {
      totalDmsSent: 0,
      totalCommentsProcessed: 0,
      totalKeywordMatches: 0,
      totalErrors: 0,
      avgProcessingTime: 0,
      daysWithActivity: 0
    };

    // Calculate success rate
    const successRate = summary.totalCommentsProcessed > 0 
      ? ((summary.totalDmsSent / summary.totalCommentsProcessed) * 100).toFixed(1)
      : 0;

    const result = {
      ...summary,
      successRate: parseFloat(successRate),
      period: `${days} days`
    };

    // Cache the result for 5 minutes
    cacheService.set(cacheKey, result, 5 * 60 * 1000);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    logger.error(`Error fetching analytics summary: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics summary"
    });
  }
};

// Get keyword performance analytics
exports.getKeywordAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get keyword usage statistics
    const keywordStats = await Keyword.find({ userId, isActive: true })
      .select('keyword matchCount lastUsed createdAt')
      .sort({ matchCount: -1 });

    // Get recent keyword matches from processed comments
    const recentMatches = await ProcessedComment.aggregate([
      {
        $match: {
          userId: toObjectId(userId),
          keywordMatched: { $exists: true, $ne: null },
          processedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }
      },
      {
        $group: {
          _id: "$keywordMatched",
          count: { $sum: 1 },
          dmsSent: { $sum: { $cond: ["$dmSent", 1, 0] } },
          lastUsed: { $max: "$processedAt" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        keywordStats,
        recentMatches,
        totalActiveKeywords: keywordStats.length
      }
    });
  } catch (err) {
    logger.error(`Error fetching keyword analytics: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch keyword analytics"
    });
  }
};

// Get timeline analytics
exports.getTimelineAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const timelineData = await Analytics.find({
      userId,
      date: { $gte: startDate }
    })
    .select('date dmsSent commentsProcessed keywordMatches errors')
    .sort({ date: 1 });

    // Fill in missing dates with zero values
    const filledData = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = timelineData.find(d => 
        d.date.toISOString().split('T')[0] === dateStr
      );

      filledData.push({
        date: dateStr,
        dmsSent: existingData?.dmsSent || 0,
        commentsProcessed: existingData?.commentsProcessed || 0,
        keywordMatches: existingData?.keywordMatches || 0,
        errorCount: existingData?.errorCount || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: {
        timeline: filledData,
        period: `${days} days`
      }
    });
  } catch (err) {
    logger.error(`Error fetching timeline analytics: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timeline analytics"
    });
  }
};

// Legacy endpoint for backward compatibility
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's analytics or create empty one
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await Analytics.findOne({ userId, date: today });
    
    if (!analytics) {
      analytics = {
        dmsSent: 0,
        commentsProcessed: 0,
        keywordMatches: 0,
        errors: 0,
        date: today
      };
    }

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    logger.error(`Error fetching analytics: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics"
    });
  }
};