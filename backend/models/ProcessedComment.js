const mongoose = require("mongoose");

// Сколько живут записи: история и дедуп — квартал, дальше Mongo сносит сам.
// Точный момент последнего прогона Mongo не отдает (на Atlas M0 нет
// серверных метрик), поэтому наружу показываем retention-панель:
// всего записей + самая старая + политика.
const PROCESSED_COMMENT_TTL_DAYS = 90;
const PROCESSED_COMMENT_TTL_SECONDS = PROCESSED_COMMENT_TTL_DAYS * 24 * 60 * 60;

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
// TTL 90 дней: история и дедуп живут квартал, дальше Mongo сносит сам.
// От дублей после протухания страхует гейт fallback по возрасту (48ч).
ProcessedCommentSchema.index({ processedAt: 1 }, { expireAfterSeconds: PROCESSED_COMMENT_TTL_SECONDS });

module.exports = mongoose.model("ProcessedComment", ProcessedCommentSchema);
module.exports.PROCESSED_COMMENT_TTL_DAYS = PROCESSED_COMMENT_TTL_DAYS;