const mongoose = require("mongoose");

const KeywordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  keyword: { type: String, required: true },
  message: { type: String, required: true },
  // Текст для НЕподписанных на бизнес (проверка is_user_follow_business).
  // Пусто = всем шлется основной message, проверка подписки не вызывается.
  messageForNonFollowers: { type: String, default: '' },
  // Кнопка быстрой проверки подписки в Директ (как в ChatPlace)
  enableFollowCheckButton: { type: Boolean, default: true },
  followButtonText: { type: String, default: '✅ Я подписался' },
  notFollowedYetMessage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  // Скоуп постов: какие media (ID постов) отслеживает keyword.
  // Пустой массив = глобально, срабатывает под любым постом (обратная совместимость).
  mediaIds: { type: [String], default: [] },
  matchCount: { type: Number, default: 0 },
  lastUsed: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound index for efficient queries
KeywordSchema.index({ userId: 1, keyword: 1, isActive: 1 });
// Скоуп по mediaId: глобальные (пустой/отсутствующий массив) + конкретный пост
KeywordSchema.index({ userId: 1, isActive: 1, mediaIds: 1 });

/**
 * Активные keywords юзера, применимые к посту mediaId:
 * глобальные (mediaIds пуст или поле отсутствует — старые записи)
 * плюс привязанные к этому посту. Пустой mediaId ('unknown')
 * матчит только глобальные.
 */
KeywordSchema.statics.findForMedia = function(userId, mediaId) {
  return this.find({
    userId,
    isActive: true,
    $or: [
      { mediaIds: { $exists: false } },
      { mediaIds: { $size: 0 } },
      { mediaIds: String(mediaId) }
    ]
  });
};

// Update the updatedAt field before saving
KeywordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Keyword", KeywordSchema);