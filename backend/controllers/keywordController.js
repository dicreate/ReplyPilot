const Keyword = require("../models/Keyword");
const logger = require("../utils/logger");
const messageProcessor = require("../utils/messageProcessor");
const cacheService = require("../services/cacheService");

// Get all keywords for a user
exports.getKeywords = async (req, res) => {
  try {
    const userId = req.user.id;
    const keywords = await Keyword.find({ userId, isActive: true }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: keywords
    });
  } catch (err) {
    logger.error(`Error fetching keywords for user ${req.user.id}: ${err.message}`);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch keywords" 
    });
  }
};

// Add a new keyword
exports.addKeyword = async (req, res) => {
  try {
    const { 
      keyword, 
      message, 
      messageForNonFollowers,
      enableFollowCheckButton,
      followButtonText,
      notFollowedYetMessage
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!keyword || !message) {
      return res.status(400).json({
        success: false,
        message: "Keyword and message are required"
      });
    }

    if (keyword.trim().length === 0 || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keyword and message cannot be empty"
      });
    }

    const altMessage = (messageForNonFollowers || '').trim();
    if (altMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Non-follower message is too long (maximum 1000 characters)"
      });
    }

    // Check for duplicate keywords
    const existingKeyword = await Keyword.findOne({ 
      userId, 
      keyword: keyword.trim().toLowerCase(),
      isActive: true 
    });

    if (existingKeyword) {
      return res.status(409).json({
        success: false,
        message: "This keyword already exists. Please use a different keyword or update the existing one."
      });
    }

    // Create new keyword
    const newKeyword = new Keyword({
      userId,
      keyword: keyword.trim().toLowerCase(),
      message: message.trim(),
      messageForNonFollowers: altMessage,
      enableFollowCheckButton: enableFollowCheckButton !== undefined ? enableFollowCheckButton : true,
      followButtonText: typeof followButtonText === 'string' && followButtonText.trim() ? followButtonText.trim() : '✅ Я подписался',
      notFollowedYetMessage: (notFollowedYetMessage || '').trim()
    });

    await newKeyword.save();

    // Invalidate user cache
    cacheService.invalidateUser(userId);

    logger.info(`New keyword added by user ${req.user.id}: ${keyword}`);

    res.status(201).json({
      success: true,
      data: newKeyword,
      message: "Keyword added successfully"
    });
  } catch (err) {
    logger.error(`Error adding keyword for user ${req.user.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to add keyword"
    });
  }
};

// Update an existing keyword
exports.updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      keyword, 
      message, 
      messageForNonFollowers,
      enableFollowCheckButton,
      followButtonText,
      notFollowedYetMessage
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!keyword || !message) {
      return res.status(400).json({
        success: false,
        message: "Keyword and message are required"
      });
    }

    if (keyword.trim().length === 0 || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keyword and message cannot be empty"
      });
    }

    const altMessage = (messageForNonFollowers || '').trim();
    if (altMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Non-follower message is too long (maximum 1000 characters)"
      });
    }

    // Find the keyword to update
    const existingKeyword = await Keyword.findOne({ _id: id, userId, isActive: true });
    if (!existingKeyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword not found"
      });
    }

    // Check for duplicate keywords (excluding the current one)
    const duplicateKeyword = await Keyword.findOne({ 
      userId, 
      keyword: keyword.trim().toLowerCase(),
      isActive: true,
      _id: { $ne: id }
    });

    if (duplicateKeyword) {
      return res.status(409).json({
        success: false,
        message: "This keyword already exists. Please use a different keyword."
      });
    }

    // Update the keyword
    existingKeyword.keyword = keyword.trim().toLowerCase();
    existingKeyword.message = message.trim();
    existingKeyword.messageForNonFollowers = altMessage;
    if (enableFollowCheckButton !== undefined) {
      existingKeyword.enableFollowCheckButton = enableFollowCheckButton;
    }
    if (followButtonText !== undefined) {
      existingKeyword.followButtonText = followButtonText.trim() || '✅ Я подписался';
    }
    if (notFollowedYetMessage !== undefined) {
      existingKeyword.notFollowedYetMessage = notFollowedYetMessage.trim();
    }
    existingKeyword.updatedAt = new Date();

    await existingKeyword.save();

    logger.info(`Keyword updated by user ${req.user.id}: ${keyword}`);

    res.status(200).json({
      success: true,
      data: existingKeyword,
      message: "Keyword updated successfully"
    });
  } catch (err) {
    logger.error(`Error updating keyword for user ${req.user.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to update keyword"
    });
  }
};

// Delete a keyword
exports.deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find and soft delete the keyword
    const keyword = await Keyword.findOne({ _id: id, userId, isActive: true });
    if (!keyword) {
      return res.status(404).json({
        success: false,
        message: "Keyword not found"
      });
    }

    // Soft delete by setting isActive to false
    keyword.isActive = false;
    keyword.updatedAt = new Date();
    await keyword.save();

    logger.info(`Keyword deleted by user ${req.user.id}: ${keyword.keyword}`);

    res.status(200).json({
      success: true,
      message: "Keyword deleted successfully"
    });
  } catch (err) {
    logger.error(`Error deleting keyword for user ${req.user.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to delete keyword"
    });
  }
};

// Get available placeholders for messages
exports.getPlaceholders = async (req, res) => {
  try {
    const placeholders = messageProcessor.getAvailablePlaceholders();
    
    res.status(200).json({
      success: true,
      data: placeholders
    });
  } catch (err) {
    logger.error(`Error fetching placeholders: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch placeholders"
    });
  }
};

// Preview a message with sample data
exports.previewMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required for preview"
      });
    }

    const validation = messageProcessor.validatePlaceholders(message);
    const preview = messageProcessor.previewMessage(message);

    res.status(200).json({
      success: true,
      data: {
        preview,
        validation
      }
    });
  } catch (err) {
    logger.error(`Error previewing message: ${err.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to preview message"
    });
  }
};