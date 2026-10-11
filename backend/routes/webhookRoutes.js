const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');
const User = require('../models/User');
const Keyword = require('../models/Keyword');
const ProcessedComment = require('../models/ProcessedComment');
const Analytics = require('../models/Analytics');
const IgConversation = require('../models/IgConversation');
const keywordMatchingService = require('../services/keywordMatchingService');
const instagramService = require('../services/instagramService');
const messageProcessor = require('../utils/messageProcessor');

/**
 * Instagram Webhook Verification Endpoint
 * Facebook calls this to verify your webhook URL
 */
router.get('/instagram', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info(`Webhook verification request: mode=${mode}, token=${token}`);

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        // Respond with 200 OK and challenge token from the request
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        logger.warn('Webhook verification failed: invalid token');
        res.sendStatus(403);
      }
    } else {
      logger.warn('Webhook verification failed: missing parameters');
      res.sendStatus(400);
    }
  } catch (error) {
    logger.error(`Webhook verification error: ${error.message}`);
    res.sendStatus(500);
  }
});

/**
 * Instagram Webhook Event Endpoint
 * Facebook sends webhook events here
 */
router.post('/instagram', async (req, res) => {
  try {
    // Verify the request signature
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
      logger.warn('Webhook event rejected: missing signature');
      return res.sendStatus(401);
    }

    // Verify signature
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', process.env.INSTAGRAM_CLIENT_SECRET)
      .update(req.body)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logger.warn('Webhook event rejected: invalid signature');
      return res.sendStatus(401);
    }

    // Parse the webhook payload
    const payload = JSON.parse(req.body.toString());
    logger.info(`Webhook event received: ${JSON.stringify(payload, null, 2)}`);

    // Process webhook events
    if (payload.entry) {
      for (const entry of payload.entry) {
        // 1. Handling messaging events (capture IGSID)
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            try {
              await handleMessagingEvent(entry.id, messagingEvent);
            } catch (msgErr) {
              logger.error(`Messaging event handling failed: ${msgErr.message}`);
            }
          }
        }

        // 2. Handling field changes (comments)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              logger.info(`New comment event: ${JSON.stringify(change.value)}`);
              try {
                await handleCommentEvent(entry.id, change.value, entry.time);
              } catch (eventError) {
                logger.error(`Comment event handling failed: ${eventError.message}`);
              }
            }
          }
        }
      }
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    logger.error(`Webhook event processing error: ${error.message}`);
    res.sendStatus(500);
  }
});

/**
 * Capture IGSID from messaging events (sender.id) and handle follow verification button clicks
 */
async function handleMessagingEvent(ownerIgId, messagingEvent) {
  const senderId = messagingEvent.sender?.id;
  if (!senderId) return;

  // Свои echo (is_echo:true, sender = сам бизнес-аккаунт): отголоски наших же
  // отправок. IGSID не каптурим, триггеры не обрабатываем — иначе текст нашего
  // же ответа может совпасть с текстовым триггером подписки и запустит
  // follow-проверку и отправку самим себе.
  if (messagingEvent.message?.is_echo === true || String(senderId) === String(ownerIgId)) {
    logger.info(`Skipping own echo event from ${senderId}`);
    return;
  }

  logger.info(`Captured IGSID ${senderId} for owner ${ownerIgId}`);
  try {
    await IgConversation.findOneAndUpdate(
      { ownerIgId: String(ownerIgId), igsId: String(senderId) },
      {
        ownerIgId: String(ownerIgId),
        igsId: String(senderId),
        lastInteraction: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.error(`Failed to save IGSID ${senderId}: ${err.message}`);
  }

  // 1. Проверка клика по кнопке (Quick Reply или Postback)
  const quickReplyPayload = messagingEvent.message?.quick_reply?.payload;
  const postbackPayload = messagingEvent.postback?.payload;
  const payload = quickReplyPayload || postbackPayload;

  if (payload && typeof payload === 'string' && payload.startsWith('CHECK_FOLLOW_')) {
    const keywordId = payload.replace('CHECK_FOLLOW_', '').trim();
    logger.info(`Received follow check button click from ${senderId} for keyword ID: ${keywordId}`);
    await processFollowVerification(ownerIgId, senderId, keywordId);
    return;
  }

  // 2. Fallback: если пользователь ответил текстом вроде "подписался" / "я подписался"
  const incomingText = (messagingEvent.message?.text || '').trim().toLowerCase();
  if (/^(?:я\s+)?подписал(?:ся|ась)|готово|подписка|subscribed?$/i.test(incomingText)) {
    logger.info(`Received follow check text trigger "${incomingText}" from ${senderId}`);
    await processFollowVerification(ownerIgId, senderId, null);
  }
}

/**
 * Повторная проверка подписки и отправка целевого сообщения в Директ (механика ChatPlace)
 */
async function processFollowVerification(ownerIgId, senderId, keywordId = null) {
  try {
    let keyword = null;
    if (keywordId) {
      keyword = await Keyword.findById(keywordId);
    }

    // Ищем бизнес-аккаунт / пользователя владельца
    let user = null;
    if (keyword?.userId) {
      user = await User.findById(keyword.userId);
    }

    if (!user || !user.accessToken) {
      user = await User.findOne({
        $or: [
          { instagramId: String(ownerIgId) },
          { instagramAccounts: { $elemMatch: { instagramId: String(ownerIgId) } } },
        ],
      });
      if (!user && process.env.INSTAGRAM_BUSINESS_ID && String(ownerIgId) === String(process.env.INSTAGRAM_BUSINESS_ID)) {
        user = await User.findOne().sort({ lastLogin: -1 });
      }
    }

    if (!user || !user.accessToken) {
      logger.warn(`No user or accessToken found for owner ${ownerIgId} (keyword: ${keywordId})`);
      return;
    }

    // Если keywordId не был передан (текстовый триггер), берем последнее активное правило с проверкой
    if (!keyword) {
      keyword = await Keyword.findOne({
        userId: user._id,
        isActive: true,
        messageForNonFollowers: { $ne: '' }
      }).sort({ lastUsed: -1, updatedAt: -1 });
    }

    if (!keyword) {
      logger.warn(`No suitable keyword found for follow verification for user ${user._id}`);
      return;
    }

    // Проверяем подписку через Instagram Graph API (is_user_follow_business)
    const isFollower = await instagramService.isFollower(senderId, user.accessToken);
    logger.info(`Follow check result for ${senderId}: ${isFollower}`);

    let username = '';
    const conv = await IgConversation.findOne({ igsId: String(senderId) });
    if (conv && conv.username) {
      username = conv.username;
    }

    const context = { username: username || 'друг', keyword: keyword.keyword };

    // Если подписан или fail-open при сбое API
    if (isFollower === true || isFollower === null) {
      const mainText = messageProcessor.processMessage(keyword.message, context);
      logger.info(`User ${senderId} confirmed subscription! Sending main response for keyword "${keyword.keyword}"`);

      const sendResult = await instagramService.sendDirectMessage(
        senderId,
        mainText,
        user.accessToken,
        user.instagramId || ownerIgId
      );

      if (sendResult.success) {
        keyword.matchCount = (keyword.matchCount || 0) + 1;
        keyword.lastUsed = new Date();
        await keyword.save();
        await updateWebhookAnalytics(user._id, true, true, false);
      } else {
        logger.error(`Failed to send main response to ${senderId}: ${sendResult.error}`);
        await updateWebhookAnalytics(user._id, true, false, true);
      }
    } else {
      // Пользователь нажал кнопку, но всё ещё не подписан
      const retryText = keyword.notFollowedYetMessage?.trim() || 
        "Подписка пока не найдена 🥺 Пожалуйста, перейдите в профиль, подпишитесь и нажмите кнопку снова!";
      const processedRetryText = messageProcessor.processMessage(retryText, context);

      let retryQuickReplies = null;
      if (keyword.enableFollowCheckButton !== false) {
        const buttonTitle = (keyword.followButtonText || '✅ Я подписался').trim().slice(0, 20);
        retryQuickReplies = [
          {
            content_type: 'text',
            title: buttonTitle,
            payload: `CHECK_FOLLOW_${keyword._id}`,
          },
        ];
      }

      logger.info(`User ${senderId} is not subscribed yet. Sending retry prompt with button.`);
      await instagramService.sendDirectMessage(
        senderId,
        processedRetryText,
        user.accessToken,
        user.instagramId || ownerIgId,
        null,
        retryQuickReplies
      );
    }
  } catch (error) {
    logger.error(`Error in processFollowVerification: ${error.message}`);
  }
}

/**
 * Обработка входящего комментария с вебхука: дедуп, мэтчинг keyword, DM.
 * Тот же результат, что и ручной Process, но в реальном времени.
 */
async function handleCommentEvent(entryId, value, entryTime = null) {
  const commentId = value?.id;
  const text = value?.text || '';
  const from = value?.from || {};
  const mediaId = value?.media?.id || 'unknown';

  if (!commentId || !text) {
    logger.warn('Comment event skipped: missing id or text');
    return;
  }

  // entry.id = ID Instagram бизнес-аккаунта → ищем его владельца у нас.
  // Нюанс: entry.id приходит в неймспейсе Dashboard (напр. 17841448838305464),
  // а user.instagramId — app-scoped user_id из обмена токена, они НЕ совпадают.
  // Поэтому дополнительно матчим по INSTAGRAM_BUSINESS_ID из backend/.env.
  let user = await User.findOne({
    $or: [
      { instagramId: String(entryId) },
      { instagramAccounts: { $elemMatch: { instagramId: String(entryId) } } },
    ],
  });
  if (!user && process.env.INSTAGRAM_BUSINESS_ID && String(entryId) === String(process.env.INSTAGRAM_BUSINESS_ID)) {
    user = await User.findOne().sort({ lastLogin: -1 });
    if (user) logger.info(`Mapped business account ${entryId} to user ${user.username} via INSTAGRAM_BUSINESS_ID`);
  }
  if (!user || !user.accessToken) {
    logger.warn(`Comment event skipped: no user for Instagram account ${entryId}`);
    return;
  }

  // Свои комменты пропускаем (защита от петель)
  const ownIds = [user.instagramId, ...((user.instagramAccounts || []).map((a) => a.instagramId))]
    .filter(Boolean)
    .map(String);
  if (from.id && ownIds.includes(String(from.id))) {
    logger.info(`Skipping own comment ${commentId} from ${from.username}`);
    return;
  }

  // Дедуп: уже обработанные не трогаем
  const existing = await ProcessedComment.findOne({ commentId });
  if (existing) {
    logger.info(`Comment ${commentId} already processed, skipping`);
    return;
  }

  // Только keywords, применимые к этому посту: глобальные + привязанные к mediaId.
  // Пустой mediaId ('unknown') матчит только глобальные.
  const keywords = await Keyword.findForMedia(user._id, mediaId);

  const record = new ProcessedComment({
    userId: user._id,
    commentId,
    mediaId,
    commentText: text,
    commentAuthor: from.username || 'unknown',
    commentAuthorId: from.id ? String(from.id) : 'unknown',
  });

  let matchedKeyword = null;
  let responseMessage = null;
  let resolvedQuickReplies = null;

  if (keywords.length > 0 && !keywordMatchingService.shouldIgnoreComment(text)) {
    const bestMatch = keywordMatchingService.getBestMatch(text, keywords);
    if (bestMatch) {
      matchedKeyword = bestMatch.keyword;
      // Текст с учетом подписки автора (is_user_follow_business).
      const resolved = await instagramService.resolveResponseMessage(
        matchedKeyword,
        { username: from.username, keyword: matchedKeyword.keyword },
        from.id ? String(from.id) : 'unknown',
        user.accessToken
      );
      responseMessage = resolved.text;
      resolvedQuickReplies = resolved.quickReplies;
      record.keywordMatched = matchedKeyword.keyword;
      record.responseMessage = responseMessage;
    }
  }

  if (matchedKeyword && responseMessage) {
    try {
      const dmResult = await instagramService.sendDirectMessage(
        from.id || 'unknown',
        responseMessage,
        user.accessToken,
        user.instagramId,
        commentId,
        resolvedQuickReplies,
        entryTime
      );

      if (dmResult.success) {
        record.dmSent = true;
        record.dmSentAt = new Date();
        matchedKeyword.matchCount += 1;
        matchedKeyword.lastUsed = new Date();
        await matchedKeyword.save();
        logger.info(`Webhook DM sent to ${from.username} for keyword "${matchedKeyword.keyword}"`);
      } else {
        throw new Error(dmResult.error);
      }
    } catch (dmError) {
      logger.error(`Webhook DM failed for ${from.username}: ${dmError.message}`);
      record.errorMessage = dmError.message;
    }
  } else {
    logger.info(`No keyword match for comment ${commentId} ("${text}")`);
  }

  await record.save();
  await updateWebhookAnalytics(user._id, !!matchedKeyword, record.dmSent, !!record.errorMessage);
}

async function updateWebhookAnalytics(userId, matched, dmSent, failed) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await Analytics.findOne({ userId, date: today });
    if (!analytics) {
      analytics = new Analytics({
        userId,
        date: today,
        dmsSent: dmSent ? 1 : 0,
        commentsProcessed: 1,
        keywordMatches: matched ? 1 : 0,
        errorCount: failed ? 1 : 0,
      });
    } else {
      if (dmSent) analytics.dmsSent += 1;
      analytics.commentsProcessed += 1;
      if (matched) analytics.keywordMatches += 1;
      if (failed) analytics.errorCount += 1;
    }
    await analytics.save();
  } catch (err) {
    logger.error(`Error updating webhook analytics: ${err.message}`);
  }
}

module.exports = router;