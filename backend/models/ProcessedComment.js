const mongoose = require("mongoose");

const ProcessedCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  commentId: { type: String, required: true, unique: true },
  mediaId: { type: String, required: true },
  commentText: { type: String, required: true },
  commentAuthor: { type: String, required: true },
  commentAuthorId: { type: String, required: true },
  keywordMatched: { type: String },
  responseMessage: { type: String },
  dmSent: { type: Boolean, default: false },
  dmSentAt: { type: Date },
  errorMessage: { type: String }, // Renamed from 'error' to avoid reserved keyword warning
  processedAt: { type: Date, default: Date.now },
  retryCount: { type: Number, default: 0 }
}, {
  suppressReservedKeysWarning: true // Suppress reserved keys warning
});

// Create indexes for efficient queries
ProcessedCommentSchema.index({ userId: 1, mediaId: 1 });
ProcessedCommentSchema.index({ processedAt: -1 });

module.exports = mongoose.model("ProcessedComment", ProcessedCommentSchema);