const User = require("../models/User");
const Keyword = require("../models/Keyword");
const ProcessedComment = require("../models/ProcessedComment");
const Analytics = require("../models/Analytics");
const logger = require("../utils/logger");
const { sendErrorEmail } = require("../utils/notifier");
const instagramService = require("../services/instagramService");
const keywordMatchingService = require("../services/keywordMatchingService");

// Process comments for a specific media
exports.processMediaComments = async (req, res) => {
  const { mediaId } = req.params;
  const userId = req.user.id;

  try {
    // Validate media ID
    if (!mediaId || !/^\d+$/.test(mediaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID format"
      });
    }

    // Возрастной фильтр комментов: sinceHours (число, часы назад).
    // Отсутствует = за всё время (обратная совместимость).
    let cutoff = null;
    if (req.body?.sinceHours !== undefined && req.body?.sinceHours !== null && req.body.sinceHours !== '') {
      const sinceHours = Number(req.body.sinceHours);
      if (!Number.isFinite(sinceHours) || sinceHours <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid sinceHours: must be a positive number of hours"
        });
      }
      cutoff = Date.now() - sinceHours * 3600 * 1000;
    }

    // Get user's access token
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(404).json({
        success: false,
        message: "User not found or access token missing"
      });
    }

    // Check if processing is already in progress for this media
    const recentProcessing = await ProcessedComment.findOne({
      userId,
      mediaId,
      processedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
    });

    if (recentProcessing) {
      return res.status(429).json({
        success: false,
        message: "This media was processed recently. Please wait before processing again."
      });
    }

    logger.info(`Starting comment processing for media ${mediaId} by user ${user.username || user.instagramId}`);

    // Fetch comments from Instagram API
    const commentsResult = await instagramService.fetchComments(mediaId, user.accessToken);
    
    if (!commentsResult.success) {
      if (commentsResult.status === 400) {
        return res.status(400).json({
          success: false,
          message: "Invalid media ID or you don't have access to this media"
        });
      } else if (commentsResult.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Instagram access token expired. Please re-authenticate."
        });
      }
      
      throw new Error(commentsResult.error);
    }
    
    const comments = commentsResult.data;

    if (comments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No comments found on this media",
        data: {
          totalComments: 0,
          newComments: 0,
          keywordMatches: 0,
          dmsSent: 0,
          errors: 0
        }
      });
    }

    // Keywords, применимые к этому посту: глобальные + привязанные к mediaId
    const keywords = await Keyword.findForMedia(userId, mediaId);
    if (keywords.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active keywords found. Please add keywords first.",
        data: {
          totalComments: comments.length,
          newComments: 0,
          keywordMatches: 0,
          dmsSent: 0,
          errors: 0
        }
      });
    }

    // Process each comment
    const results = {
      totalComments: comments.length,
      newComments: 0,
      keywordMatches: 0,
      dmsSent: 0,
      errors: 0,
      skippedByAge: 0,
      processedComments: []
    };

    for (const comment of comments) {
      try {
        // Check if comment was already processed
        const existingComment = await ProcessedComment.findOne({ commentId: comment.id });
        if (existingComment) {
          continue; // Skip already processed comments
        }

        // Возрастной фильтр: старше cutoff — скипаем БЕЗ записи,
        // чтобы более широкий прогон потом их подобрал
        if (cutoff !== null && comment.timestamp) {
          const ts = new Date(comment.timestamp).getTime();
          if (Number.isFinite(ts) && ts < cutoff) {
            results.skippedByAge++;
            continue;
          }
        }

        // ВАЖНО: в Instagram Platform username верхнего уровня нет —
        // автор только в comment.from ({id, username}). Без фолбэка ниже
        // commentAuthor сохранялся undefined и падала валидация ProcessedComment.
        const authorUsername = comment.username || comment.from?.username || 'unknown';
        const authorId = comment.from?.id ? String(comment.from.id) : 'unknown';

        results.newComments++;

        // Skip comments that should be ignored
        if (keywordMatchingService.shouldIgnoreComment(comment.text)) {
          continue;
        }

        // Check for keyword matches using the matching service
        const bestMatch = keywordMatchingService.getBestMatch(comment.text, keywords);
        let matchedKeyword = null;
        let responseMessage = null;
        // resolved объявлен здесь: использование const внутри if ниже
        // давало ReferenceError в ветке отправки DM (DM не отправлялись вообще).
        let resolved = null;

        if (bestMatch) {
          matchedKeyword = bestMatch.keyword;
          // Текст с учетом подписки автора (is_user_follow_business).
          resolved = await instagramService.resolveResponseMessage(
            matchedKeyword,
            { username: authorUsername, keyword: matchedKeyword.keyword },
            authorId,
            user.accessToken
          );
          responseMessage = resolved.text;
          results.keywordMatches++;
        }

        // Create processed comment record
        const processedComment = new ProcessedComment({
          userId,
          commentId: comment.id,
          mediaId,
          commentText: comment.text,
          commentAuthor: authorUsername,
          commentAuthorId: authorId,
          keywordMatched: matchedKeyword?.keyword,
          responseMessage
        });

        // If keyword matched, try to send DM.
        // sendDirectMessage ОБЯЗАТЕЛЬНО нужен igUserId (ID бизнес-аккаунта
        // из user.instagramId) — без него URL .../undefined/messages и DM падает.
        // commentId передаем для корректного fallback'а в private reply.
        if (matchedKeyword && responseMessage) {
          try {
            const dmResult = await instagramService.sendDirectMessage(
              authorId,
              responseMessage,
              user.accessToken,
              user.instagramId,
              comment.id,
              resolved?.quickReplies,
              comment.timestamp
            );

            if (dmResult.success) {
              processedComment.dmSent = true;
              processedComment.dmSentAt = new Date();
              results.dmsSent++;

              // Update keyword usage statistics
              matchedKeyword.matchCount += 1;
              matchedKeyword.lastUsed = new Date();
              await matchedKeyword.save();

              logger.info(`DM sent to ${authorUsername} for keyword "${matchedKeyword.keyword}"`);
            } else {
              throw new Error(dmResult.error);
            }

          } catch (dmError) {
            logger.error(`Failed to send DM to ${authorUsername}: ${dmError.message}`);
            processedComment.errorMessage = dmError.message;
            results.errors++;
          }
        }

        await processedComment.save();
        results.processedComments.push({
          commentId: comment.id,
          author: authorUsername,
          text: comment.text,
          keywordMatched: matchedKeyword?.keyword,
          dmSent: processedComment.dmSent
        });

      } catch (commentError) {
        logger.error(`Error processing comment ${comment.id}: ${commentError.message}`);
        results.errors++;
      }
    }

    // Update analytics
    await updateAnalytics(userId, results);

    logger.info(`Completed processing for media ${mediaId}: ${results.dmsSent} DMs sent, ${results.errors} errors`);

    res.status(200).json({
      success: true,
      message: `Processed ${results.newComments} new comments. ${results.dmsSent} DMs sent.` +
        (results.skippedByAge > 0 ? ` ${results.skippedByAge} skipped by age filter.` : ''),
      data: results
    });

  } catch (err) {
    logger.error(`Error processing media ${mediaId}: ${err.message}`);
    await sendErrorEmail(`Media processing failed for ${mediaId}`, { error: err.message, userId });
    
    res.status(500).json({
      success: false,
      message: "Failed to process comments"
    });
  }
};

// Get processing history
exports.getProcessingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, failed } = req.query;

    const skip = (page - 1) * limit;

    // ?failed=true — только ошибки отправки (не ушло + есть текст ошибки).
    // Комменты без совпадения (dmSent=false без errorMessage) сюда не попадают.
    const filter = { userId };
    if (String(failed).toLowerCase() === 'true') {
      filter.dmSent = false;
      filter.errorMessage = { $exists: true, $nin: [null, ''] };
    }

    const history = await ProcessedComment.find(filter)
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('commentId mediaId commentAuthor commentText keywordMatched dmSent processedAt errorMessage');

    const total = await ProcessedComment.countDocuments(filter);

    // Retention-панель: точный момент последнего прогона TTL Mongo не отдает,
    // показываем состояние хранилища (всего + самая старая запись + политика).
    // total всего хранилища считаем отдельно — при ?failed=true total выше уже фильтр.
    const totalAll = await ProcessedComment.countDocuments({ userId });
    const oldest = await ProcessedComment.findOne({ userId })
      .sort({ processedAt: 1 })
      .select('processedAt');

    res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        storage: {
          total: totalAll,
          oldestProcessedAt: oldest?.processedAt || null,
          ttlDays: ProcessedComment.PROCESSED_COMMENT_TTL_DAYS
        }
      }
    });
  } catch (err) {
    logger.error(`Error fetching processing history: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch processing history"
    });
  }
};

// Get recent media posts
exports.getRecentMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.accessToken) {
      return res.status(404).json({
        success: false,
        message: "User not found or access token missing"
      });
    }

    // Fetch user's recent media
    const mediaResult = await instagramService.fetchRecentMedia(user.accessToken);
    
    if (!mediaResult.success) {
      if (mediaResult.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Instagram access token expired. Please re-authenticate."
        });
      }
      
      throw new Error(mediaResult.error);
    }

    const media = mediaResult.data;

    res.status(200).json({
      success: true,
      data: media
    });
  } catch (err) {
    logger.error(`Error fetching recent media: ${err.message}`);
    
    if (err.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: "Instagram access token expired. Please re-authenticate."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent media"
    });
  }
};

// Helper function to update analytics
async function updateAnalytics(userId, results) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await Analytics.findOne({ userId, date: today });
    
    if (!analytics) {
      analytics = new Analytics({
        userId,
        date: today,
        dmsSent: results.dmsSent,
        commentsProcessed: results.newComments,
        keywordMatches: results.keywordMatches,
        errorCount: results.errors
      });
    } else {
      analytics.dmsSent += results.dmsSent;
      analytics.commentsProcessed += results.newComments;
      analytics.keywordMatches += results.keywordMatches;
      analytics.errorCount += results.errors;
    }

    await analytics.save();
  } catch (err) {
    logger.error(`Error updating analytics: ${err.message}`);
  }
}