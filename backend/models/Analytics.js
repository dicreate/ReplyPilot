const mongoose = require("mongoose");

const AnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  dmsSent: { type: Number, default: 0 },
  commentsProcessed: { type: Number, default: 0 },
  keywordMatches: { type: Number, default: 0 },
  apiCallsMade: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 }, // Renamed from 'errors' to avoid reserved keyword
  processingTime: { type: Number, default: 0 }
}, {
  suppressReservedKeysWarning: true // Suppress the reserved keys warning
});

// Create compound index for efficient queries
AnalyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Analytics", AnalyticsSchema);