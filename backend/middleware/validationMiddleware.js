const logger = require("../utils/logger");

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