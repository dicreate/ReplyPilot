const mongoose = require("mongoose");

/**
 * Маппинг Instagram-Scoped ID (IGSID) ↔ username.
 *
 * IGSID — единственный ID, который Messaging API принимает в recipient.id.
 * Его можно получить ТОЛЬКО из входящего messaging-вебхука (sender.id).
 * Сохраняем при получении любого messaging-события, чтобы в будущем
 * иметь возможность отправлять DM напрямую (а не только private_reply).
 */
const IgConversationSchema = new mongoose.Schema({
  // ID бизнес-аккаунта владельца (entry.id из вебхука)
  ownerIgId: { type: String, required: true, index: true },
  // Instagram-Scoped ID собеседника (sender.id из messaging-вебхука)
  igsId: { type: String, required: true },
  // Username собеседника (если известен)
  username: { type: String },
  // Время последнего взаимодействия (для 24-часового окна messaging)
  lastInteraction: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Уникальный маппинг: один IGSID на пару owner ↔ собеседник
IgConversationSchema.index({ ownerIgId: 1, igsId: 1 }, { unique: true });

module.exports = mongoose.model("IgConversation", IgConversationSchema);
