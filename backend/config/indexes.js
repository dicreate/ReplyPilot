const User = require('../models/User');
const Keyword = require('../models/Keyword');
const Analytics = require('../models/Analytics');
const ProcessedComment = require('../models/ProcessedComment');
const logger = require('../utils/logger');

/**
 * Create database indexes for optimal performance
 * Uses safe index creation to avoid conflicts with existing indexes
 */
const createIndexes = async () => {
  try {
    logger.info('Creating database indexes...');

    // Helper function to safely create indexes
    const safeCreateIndex = async (collection, indexSpec, options = {}) => {
      try {
        await collection.createIndex(indexSpec, options);
      } catch (error) {
        if (error.code === 85 || error.message.includes('existing index')) {
          // Index already exists, skip silently
          return;
        }
        throw error;
      }
    };

    // User indexes
    await safeCreateIndex(User.collection, { instagramId: 1 }, { unique: true });
    await safeCreateIndex(User.collection, { email: 1 }, { unique: true, sparse: true });
    await safeCreateIndex(User.collection, { isActive: 1 });
    await safeCreateIndex(User.collection, { lastLogin: -1 });

    // Keyword indexes (remove duplicate from schema)
    await safeCreateIndex(Keyword.collection, { userId: 1, isActive: 1 });
    await safeCreateIndex(Keyword.collection, { userId: 1, isActive: 1, mediaIds: 1 });
    await safeCreateIndex(Keyword.collection, { matchCount: -1 });
    await safeCreateIndex(Keyword.collection, { lastUsed: -1 });
    await safeCreateIndex(Keyword.collection, { createdAt: -1 });

    // Analytics indexes (remove duplicate from schema)
    await safeCreateIndex(Analytics.collection, { date: -1 });
    await safeCreateIndex(Analytics.collection, { userId: 1, date: -1 });

    // ProcessedComment indexes (remove duplicates from schema)
    await safeCreateIndex(ProcessedComment.collection, { userId: 1, processedAt: -1 });
    await safeCreateIndex(ProcessedComment.collection, { keywordMatched: 1 });
    await safeCreateIndex(ProcessedComment.collection, { dmSent: 1 });
    // TTL 90 дней на историю/дедуп обработанных комментов
    await safeCreateIndex(ProcessedComment.collection, { processedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

    // Compound indexes for complex queries
    await safeCreateIndex(ProcessedComment.collection, { 
      userId: 1, 
      keywordMatched: 1, 
      processedAt: -1 
    });

    await safeCreateIndex(Analytics.collection, {
      userId: 1,
      date: -1,
      dmsSent: -1
    });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error(`Error creating database indexes: ${error.message}`);
    throw error;
  }
};

module.exports = { createIndexes };