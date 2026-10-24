const axios = require("axios");
const logger = require("../utils/logger");
const messageProcessor = require("../utils/messageProcessor");
const IgConversation = require("../models/IgConversation");

class InstagramService {
  constructor() {
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
    this.maxRetries = 3;
    this.baseRetryDelay = 1000; // 1 second
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  // Exponential backoff helper
  async exponentialBackoff(attempt) {
    const delay =
      this.baseRetryDelay * Math.pow(2, attempt) + Math.random() * 1000;
    logger.info(`Retrying in ${delay}ms (attempt ${attempt + 1})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Enhanced error handling for Instagram API responses
  handleInstagramError(error, context = "") {
    const response = error.response;

    if (!response) {
      return {
        success: false,
        error: `Network error: ${error.message}`,
        status: 0,
        retryable: true,
      };
    }

    const status = response.status;
    const data = response.data;

    logger.error(
      `Instagram API error ${context}: ${status} - ${JSON.stringify(data)}`
    );

    switch (status) {
      case 400:
        return {
          success: false,
          error: data.error?.message || "Bad request - Invalid parameters",
          status: 400,
          retryable: false,
          code: data.error?.code,
        };

      case 401:
        return {
          success: false,
          error: "Access token expired or invalid",
          status: 401,
          retryable: false,
          code: "TOKEN_EXPIRED",
        };

      case 403:
        return {
          success: false,
          error:
            data.error?.message ||
            "Access forbidden - Insufficient permissions",
          status: 403,
          retryable: false,
          code: data.error?.code,
        };

      case 404:
        return {
          success: false,
          error: "Resource not found or user does not have access",
          status: 404,
          retryable: false,
        };

      case 429:
        const retryAfter = response.headers["retry-after"] || 60;
        return {
          success: false,
          error: "Rate limit exceeded",
          status: 429,
          retryable: true,
          retryAfter: parseInt(retryAfter),
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          success: false,
          error: "Instagram server error - please try again later",
          status: status,
          retryable: true,
        };

      default:
        return {
          success: false,
          error: data.error?.message || `Unexpected error: ${status}`,
          status: status,
          retryable: status >= 500,
        };
    }
  }

  // Generic API request with retry logic
  async makeRequest(url, options = {}, context = "") {
    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();

        const response = await axios({
          url,
          method: "GET",
          timeout: 30000, // 30 second timeout
          ...options,
        });

        return {
          success: true,
          data: response.data.data || response.data,
          paging: response.data.paging,
        };
      } catch (error) {
        const errorResult = this.handleInstagramError(error, context);
        lastError = errorResult;

        // Don't retry if error is not retryable
        if (!errorResult.retryable) {
          break;
        }

        // Handle rate limiting
        if (errorResult.status === 429) {
          const waitTime = (errorResult.retryAfter || 60) * 1000;
          logger.warn(`Rate limited, waiting ${waitTime}ms before retry`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Exponential backoff for server errors
        if (errorResult.status >= 500) {
          await this.exponentialBackoff(attempt);
        }
      }
    }

    return lastError;
  }

  // Fetch comments for a media post
  async fetchComments(mediaId, accessToken, options = {}) {
    const params = {
      access_token: accessToken,
      // ВАЖНО: поле from нужно обязательно — без него mediaController не знает
      // ID автора (comment.from.id) и DM уходит на 'unknown'.
      fields: options.fields || "id,text,username,timestamp,from",
      limit: options.limit || 100,
    };

    if (options.after) {
      params.after = options.after;
    }

    return await this.makeRequest(
      `https://graph.instagram.com/${mediaId}/comments`,
      { params },
      `fetching comments for media ${mediaId}`
    );
  }

  // Fetch user's recent media
  async fetchRecentMedia(accessToken, options = {}) {
    const params = {
      access_token: accessToken,
      fields:
        options.fields ||
        "id,caption,media_type,media_url,thumbnail_url,timestamp,comments_count",
      limit: options.limit || 10,
    };

    return await this.makeRequest(
      `https://graph.instagram.com/me/media`,
      { params },
      "fetching recent media"
    );
  }

  // Send a direct message using the best available method.
  //
  // СТРАТЕГИЯ (после диагностики 2534014):
  // 1. PRIMARY — Private Reply на комментарий (commentId). Не требует IGSID,
  //    работает сразу после включения Live Mode. Ограничение: можно отправить
  //    только один private_reply на комментарий.
  // 2. FALLBACK — DM через /me/messages с IGSID из базы IgConversation.
  //    IGSID появляется только когда пользователь первым написал в DM
  //    бизнес-аккаунту (sender.id из messaging-вебхука).
  //
  // recipientId: comment.from.id или username — используется для поиска IGSID.
  // commentId: ID комментария — обязателен для private reply.
  // ownerIgId: ID бизнес-аккаунта — для поиска IGSID-маппинга.
  // quickReplies: массив кнопок быстрого ответа (Meta Graph API)
  // Лимит возраста коммента для DM-fallback (обычный DM без привязки к комменту
  // на старых комментах выглядит как спам; после TTL-протухания записей дедупа
  // именно fallback плодит дубли — private reply на тот же коммент Meta режет).
  // Private reply лимита не имеет. Env FALLBACK_MAX_COMMENT_AGE_HOURS, дефолт 48.
  getFallbackMaxAgeMs() {
    const hours = Number(process.env.FALLBACK_MAX_COMMENT_AGE_HOURS);
    return (Number.isFinite(hours) && hours > 0 ? hours : 48) * 3600 * 1000;
  }

  // commentTimestamp: ISO-строка (Graph API), Date или epoch (сек/мс).
  // null/нераспознанное = возраст неизвестен → разрешаем (fail-open),
  // чтобы не ломать чистые DM-потоки без commentId.
  isFallbackAllowed(commentTimestamp) {
    if (commentTimestamp == null) return true;
    let ts = null;
    if (commentTimestamp instanceof Date) {
      ts = commentTimestamp.getTime();
    } else if (typeof commentTimestamp === 'number') {
      ts = commentTimestamp < 1e12 ? commentTimestamp * 1000 : commentTimestamp;
    } else {
      const parsed = Date.parse(commentTimestamp);
      ts = Number.isNaN(parsed) ? null : parsed;
    }
    if (ts == null) return true;
    return Date.now() - ts <= this.getFallbackMaxAgeMs();
  }

  // Нормализация кнопок keyword в формат Meta button template:
  // url → web_url, postback → postback. Максимум 3, title режем до 20.
  // Тот же инвариант, что в validateKeyword — на случай старых записей из БД.
  normalizeButtons(buttons) {
    if (!Array.isArray(buttons) || buttons.length === 0) return [];
    const out = [];
    for (const raw of buttons.slice(0, 3)) {
      const title = String(raw?.title ?? '').trim().slice(0, 20);
      if (!title) continue;
      if (raw?.type === 'postback') {
        const payload = String(raw?.payload ?? '').trim().slice(0, 1000);
        if (!payload) continue;
        out.push({ type: 'postback', title, payload });
      } else {
        const url = String(raw?.url ?? '').trim();
        if (!/^https:\/\/\S+$/i.test(url)) continue;
        out.push({ type: 'web_url', title, url });
      }
    }
    return out;
  }

  // Button template: текст (лимит Meta 640) + 1–3 неисчезающие кнопки.
  buildButtonTemplate(text, buttons) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: String(text ?? '').slice(0, 640),
          buttons
        }
      }
    };
  }

  async sendDirectMessage(recipientId, message, accessToken, ownerIgId, commentId = null, quickReplies = null, commentTimestamp = null, buttons = null) {
    await this.waitForRateLimit();

    const templateButtons = this.normalizeButtons(buttons);

    // --- 1. PRIMARY: Private Reply на комментарий ---
    // Кнопки едут шаблоном прямо здесь (см. sendPrivateReply): DM-тред
    // открывается по комменту сам, IGSID не нужен. Упадет — пойдет DM-fallback.
    if (commentId) {
      logger.info(`Attempting private reply to comment ${commentId}: ${message}`);
      const replyResult = await this.sendPrivateReply(commentId, message, accessToken, ownerIgId, quickReplies, templateButtons);
      if (replyResult.success) {
        return replyResult;
      }
      logger.warn(`Private reply failed for comment ${commentId}: ${replyResult.error}`);
      // Старый коммент + упавший private reply: fallback почти наверняка
      // означает дубль (ответ уже уходил раньше, запись дедупа протухла по TTL).
      if (!this.isFallbackAllowed(commentTimestamp)) {
        logger.warn(`DM fallback skipped for comment ${commentId}: comment is older than fallback window`);
        return {
          success: false,
          error: `${replyResult.error}; DM fallback skipped (comment older than fallback window)`,
          status: replyResult.status,
        };
      }
      // Продолжаем к fallback
    }

    // --- 2. FALLBACK: DM через /me/messages с IGSID ---
    // Ищем IGSID в базе по recipientId (comment.from.id) или username
    let igsId = null;
    try {
      const conversation = await IgConversation.findOne({
        ownerIgId: String(ownerIgId),
        $or: [
          { igsId: String(recipientId) },
          { username: String(recipientId) },
        ],
      });
      if (conversation) {
        igsId = conversation.igsId;
        logger.info(`Found IGSID ${igsId} for recipient ${recipientId}`);
      }
    } catch (lookupErr) {
      logger.warn(`IGSID lookup error: ${lookupErr.message}`);
    }

    // Если в базе нет, но recipientId уже числовой IGSID (из messaging-вебхука)
    if (!igsId && /^\d+$/.test(String(recipientId))) {
      igsId = String(recipientId);
    }

    if (!igsId) {
      logger.warn(
        `No IGSID found for recipient ${recipientId}. ` +
        `DM via /me/messages requires an IGSID from a prior messaging webhook. ` +
        `Private reply ${commentId ? 'also failed' : 'not attempted (no commentId)'}.`
      );
      return {
        success: false,
        error: commentId
          ? "Private reply failed and no IGSID available for DM fallback"
          : "No commentId for private reply and no IGSID for DM",
        status: 400,
      };
    }

    try {
      logger.info(`Attempting DM via /me/messages to IGSID ${igsId}: ${message}`);

      // Кнопки → button template (неисчезающие). Шаблон quick_replies не несет —
      // при наличии кнопок они выигрывают, текст уходит внутрь template (лимит 640).
      let messagePayload;
      if (templateButtons.length > 0) {
        logger.info(`Sending button template with ${templateButtons.length} button(s) to IGSID ${igsId}`);
        messagePayload = this.buildButtonTemplate(message, templateButtons);
      } else {
        messagePayload = { text: message };
        if (Array.isArray(quickReplies) && quickReplies.length > 0) {
          messagePayload.quick_replies = quickReplies;
        }
      }

      const response = await axios.post(
        `https://graph.instagram.com/v26.0/me/messages`,
        {
          recipient: { id: igsId },
          message: messagePayload,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`DM sent successfully to IGSID ${igsId}`);

      return {
        success: true,
        messageId: response.data.message_id || `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Полное тело ошибки Meta (code/subcode различают 'нет юзера',
      // 'закрытое окно 24ч', 'нет прав'): пишем целиком для диагностики.
      logger.error(
        `Error sending DM to IGSID ${igsId}: ${
          error.response?.data?.error?.message || error.message
        } | full=${JSON.stringify(error.response?.data || null)}`
      );

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        status: error.response?.status,
      };
    }
  }

  // Private reply комментатору (основной механизм ответа на комменты).
  // По докам Instagram Platform (Instagram Login): это НЕ отдельный edge,
  // а POST на <APP_USERS_IG_ID>/messages с recipient:{comment_id}.
  // Старый путь /{comment-id}/private_replies на этой платформе не существует
  // (отвечает subcode 33 'does not support this operation').
  async sendPrivateReply(commentId, message, accessToken, appUsersIgId, quickReplies = null, templateButtons = null) {
    try {
      const tplButtons = this.normalizeButtons(templateButtons);
      logger.info(`Sending private reply to comment ${commentId}: ${message}`);

      // Кнопки едут и через private reply: recipient:{comment_id} принимает
      // тот же объект message, включая template. Так работают ChatPlace и co —
      // DM-тред с кнопками открывается сразу по комменту, без prior переписки.
      let messagePayload;
      if (tplButtons.length > 0) {
        messagePayload = this.buildButtonTemplate(message, tplButtons);
      } else {
        messagePayload = { text: message };
        if (Array.isArray(quickReplies) && quickReplies.length > 0) {
          messagePayload.quick_replies = quickReplies;
        }
      }

      const response = await axios.post(
        `https://graph.instagram.com/v26.0/${appUsersIgId}/messages`,
        {
          recipient: { comment_id: commentId },
          message: messagePayload,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`Private reply sent successfully to comment ${commentId}`);

      return {
        success: true,
        messageId: response.data.message_id || `reply_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "private_reply",
      };
    } catch (error) {
      logger.error(
        `Error sending private reply: ${
          error.response?.data?.error?.message || error.message
        }`
      );

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        status: error.response?.status,
        type: "private_reply",
      };
    }
  }

  // Проверка: подписан ли автор (IGSID) на бизнес-аккаунт.
  // Поле is_user_follow_business из User Profile API.
  // true/false; null при ошибке (fail-open: шлем основной текст).
  async isFollower(igsid, accessToken) {
    if (!igsid || igsid === 'unknown') return null;
    try {
      await this.waitForRateLimit();
      const response = await axios.get(
        `https://graph.instagram.com/v26.0/${igsid}`,
        {
          params: { fields: 'is_user_follow_business', access_token: accessToken },
          timeout: 15000,
        }
      );
      const follows = response.data.is_user_follow_business !== false;
      logger.info(`Follower check for ${igsid}: ${follows}`);
      return follows;
    } catch (error) {
      logger.warn(`Follower check failed for ${igsid}: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }

  // Выбор текста ответа с учетом подписки: если messageForNonFollowers пуст —
  // сразу основной текст (без лишнего API-вызова).
  // Иначе проверяем подписку: не подписан → альтернативный текст + кнопка, подписан/ошибка → основной.
  async resolveResponseMessage(keyword, context, authorIgsid, accessToken) {
    const mainText = messageProcessor.processMessage(keyword.message, context);
    const buttons = this.normalizeButtons(keyword.buttons);
    const altRaw = (keyword.messageForNonFollowers || '').trim();
    if (!altRaw) return { text: mainText, isFollower: null, quickReplies: null, buttons };
    const follows = await this.isFollower(authorIgsid, accessToken);
    if (follows === false) {
      let quickReplies = null;
      if (keyword.enableFollowCheckButton !== false) {
        const buttonTitle = (keyword.followButtonText || '✅ Я подписался').trim().slice(0, 20);
        quickReplies = [
          {
            content_type: 'text',
            title: buttonTitle,
            payload: `CHECK_FOLLOW_${keyword._id}`
          }
        ];
      }
      return { 
        text: messageProcessor.processMessage(altRaw, context), 
        isFollower: false, 
        quickReplies,
        buttons 
      };
    }
    return { text: mainText, isFollower: follows, quickReplies: null, buttons };
  }

  // Get user profile information
  async getUserProfile(accessToken) {
    const params = {
      access_token: accessToken,
      fields: "id,username,account_type,media_count",
    };

    return await this.makeRequest(
      `https://graph.instagram.com/me`,
      { params },
      "fetching user profile"
    );
  }

  // Refresh long-lived access token
  async refreshAccessToken(accessToken) {
    const params = {
      grant_type: "ig_refresh_token",
      access_token: accessToken,
    };

    const result = await this.makeRequest(
      `https://graph.instagram.com/refresh_access_token`,
      { params },
      "refreshing access token"
    );

    if (result.success) {
      return {
        success: true,
        data: {
          access_token: result.data.access_token,
          expires_in: result.data.expires_in,
        },
      };
    }

    return result;
  }

  // Check if access token is valid
  async validateAccessToken(accessToken) {
    try {
      const result = await this.getUserProfile(accessToken);
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new InstagramService();
