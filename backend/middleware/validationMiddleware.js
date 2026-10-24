const logger = require("../utils/logger");

// Валидация и очистка кнопок (до 3 шт: url или postback)
function validateAndCleanButtons(buttons) {
  if (!Array.isArray(buttons)) {
    return { error: "buttons must be an array (max 3)" };
  }
  if (buttons.length > 3) {
    return { error: "Too many buttons (maximum 3)" };
  }
  const cleaned = [];
  for (const raw of buttons) {
    const title = String(raw?.title ?? '').trim().slice(0, 20);
    const type = raw?.type === 'postback' ? 'postback' : 'url';
    if (!title) {
      return { error: "Button title is required (max 20 characters)" };
    }
    if (type === 'url') {
      const url = String(raw?.url ?? '').trim();
      if (!/^https:\/\/\S+$/i.test(url)) {
        return { error: `Bad URL for button "${title}"` };
      }
      cleaned.push({ title, type, url, payload: '' });
    } else {
      const payload = String(raw?.payload ?? '').trim().slice(0, 1000);
      if (!payload) {
        return { error: `Button "${title}" needs a step code` };
      }
      cleaned.push({ title, type, url: '', payload });
    }
  }
  return { cleaned };
}

// Validation middleware for keyword operations
const validateKeyword = (req, res, next) => {
  const { keyword, message } = req.body;

  // Check if required fields are present
  if (!keyword || !message) {
    return res.status(400).json({
      success: false,
      message: "Keyword and message are required",
      errors: {
        keyword: !keyword ? "Keyword is required" : null,
        message: !message ? "Message is required" : null
      }
    });
  }

  // Trim and validate content
  const trimmedKeyword = keyword.trim();
  const trimmedMessage = message.trim();

  if (trimmedKeyword.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Keyword cannot be empty",
      errors: { keyword: "Keyword cannot be empty" }
    });
  }

  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Message cannot be empty",
      errors: { message: "Message cannot be empty" }
    });
  }

  // Validate keyword length and format
  if (trimmedKeyword.length > 50) {
    return res.status(400).json({
      success: false,
      message: "Keyword is too long (maximum 50 characters)",
      errors: { keyword: "Keyword is too long (maximum 50 characters)" }
    });
  }

  if (trimmedMessage.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Message is too long (maximum 1000 characters)",
      errors: { message: "Message is too long (maximum 1000 characters)" }
    });
  }

  // Check for invalid characters in keyword
  const invalidChars = /[<>\"'&]/;
  if (invalidChars.test(trimmedKeyword)) {
    return res.status(400).json({
      success: false,
      message: "Keyword contains invalid characters",
      errors: { keyword: "Keyword cannot contain < > \" ' & characters" }
    });
  }

  // Sanitize and attach to request
  req.body.keyword = trimmedKeyword.toLowerCase();
  req.body.message = trimmedMessage;
  // Опциональный текст для неподписанных: только trim + лимит, не обязателен
  if (typeof req.body.messageForNonFollowers === 'string') {
    req.body.messageForNonFollowers = req.body.messageForNonFollowers.trim();
    if (req.body.messageForNonFollowers.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Non-follower message is too long (maximum 1000 characters)",
        errors: { messageForNonFollowers: "Maximum 1000 characters" }
      });
    }
  }

  // Опциональные поля для кнопки проверки подписки
  if (req.body.enableFollowCheckButton !== undefined) {
    req.body.enableFollowCheckButton = Boolean(req.body.enableFollowCheckButton);
  }

  if (typeof req.body.followButtonText === 'string') {
    req.body.followButtonText = req.body.followButtonText.trim();
    if (req.body.followButtonText.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Button text is too long (maximum 20 characters for Instagram quick replies)",
        errors: { followButtonText: "Maximum 20 characters" }
      });
    }
  }

  if (typeof req.body.notFollowedYetMessage === 'string') {
    req.body.notFollowedYetMessage = req.body.notFollowedYetMessage.trim();
    if (req.body.notFollowedYetMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Retry message is too long (maximum 1000 characters)",
        errors: { notFollowedYetMessage: "Maximum 1000 characters" }
      });
    }
  }

  // Кнопки автоответа: массив до 3.
  if (req.body.buttons !== undefined) {
    const btnResult = validateAndCleanButtons(req.body.buttons);
    if (btnResult.error) {
      return res.status(400).json({
        success: false,
        message: btnResult.error,
        errors: { buttons: btnResult.error }
      });
    }
    req.body.buttons = btnResult.cleaned;
  }

  // Цепочка сообщений воронки (опциональный массив шагов)
  if (req.body.steps !== undefined) {
    if (!Array.isArray(req.body.steps)) {
      return res.status(400).json({
        success: false,
        message: "steps must be an array",
        errors: { steps: "Must be an array" }
      });
    }
    if (req.body.steps.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Too many steps (maximum 20 per keyword)",
        errors: { steps: "Maximum 20 steps" }
      });
    }

    const cleanedSteps = [];
    for (let i = 0; i < req.body.steps.length; i++) {
      const rawStep = req.body.steps[i];
      const stepId = String(rawStep?.id || `step_${i + 1}`).trim();
      const name = String(rawStep?.name ?? '').trim().slice(0, 100);
      const stepMsg = String(rawStep?.message ?? '').trim();

      if (!stepMsg) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1} message cannot be empty`,
          errors: { steps: `Step ${i + 1} needs a message` }
        });
      }
      if (stepMsg.length > 1000) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1} message is too long (maximum 1000 characters)`,
          errors: { steps: `Step ${i + 1} exceeds 1000 characters` }
        });
      }

      let stepButtons = [];
      if (rawStep?.buttons !== undefined) {
        const stepBtnResult = validateAndCleanButtons(rawStep.buttons);
        if (stepBtnResult.error) {
          return res.status(400).json({
            success: false,
            message: `Step ${i + 1}: ${stepBtnResult.error}`,
            errors: { steps: stepBtnResult.error }
          });
        }
        stepButtons = stepBtnResult.cleaned;
      }

      cleanedSteps.push({
        id: stepId,
        name: name || `Шаг ${i + 1}`,
        message: stepMsg,
        buttons: stepButtons
      });
    }
    req.body.steps = cleanedSteps;
  }

  // Скоуп постов: опциональный массив ID постов.
  // Пустой/отсутствует = глобально под любым постом (обратная совместимость).
  if (req.body.mediaIds !== undefined) {
    if (!Array.isArray(req.body.mediaIds)) {
      return res.status(400).json({
        success: false,
        message: "mediaIds must be an array of post IDs",
        errors: { mediaIds: "Must be an array" }
      });
    }
    if (req.body.mediaIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Too many posts selected (maximum 50 per keyword)",
        errors: { mediaIds: "Maximum 50 posts" }
      });
    }
    const cleaned = [];
    for (const raw of req.body.mediaIds) {
      const id = String(raw ?? '').trim();
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID in mediaIds (must be numeric Instagram media IDs)",
          errors: { mediaIds: `Invalid post ID: ${id}` }
        });
      }
      if (!cleaned.includes(id)) cleaned.push(id);
    }
    req.body.mediaIds = cleaned;
  }

  next();
};

// Validation middleware for media ID
const validateMediaId = (req, res, next) => {
  const { mediaId } = req.params;

  if (!mediaId) {
    return res.status(400).json({
      success: false,
      message: "Media ID is required"
    });
  }

  // Basic Instagram media ID validation (should be numeric)
  if (!/^\d+$/.test(mediaId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid media ID format"
    });
  }

  next();
};

// General input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS characters
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        obj[key] = obj[key].replace(/javascript:/gi, '');
        obj[key] = obj[key].replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  validateKeyword,
  validateMediaId,
  sanitizeInput
};
