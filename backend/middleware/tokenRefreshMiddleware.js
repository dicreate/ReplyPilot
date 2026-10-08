const axios = require("axios");
const logger = require("../utils/logger");

const tokenRefreshMiddleware = async (req, res, next) => {
  try {
    // Only run this middleware if we have a user document from authMiddleware
    if (!req.userDoc) {
      return next();
    }

    const user = req.userDoc;
    
    // Check if token needs refresh (if it's older than 50 days for Instagram long-lived tokens)
    const tokenAge = Date.now() - user.updatedAt.getTime();
    const fiftyDaysInMs = 50 * 24 * 60 * 60 * 1000;
    
    if (tokenAge > fiftyDaysInMs) {
      logger.info(`Attempting to refresh token for user ${user.username || user.instagramId}`);
      
      try {
        const refreshResponse = await axios.get(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${user.accessToken}`
        );
        
        user.accessToken = refreshResponse.data.access_token;
        user.tokenExpiresAt = new Date(Date.now() + (refreshResponse.data.expires_in * 1000));
        await user.save();
        
        logger.info(`Token refreshed successfully for user ${user.username || user.instagramId}`);
      } catch (refreshErr) {
        logger.warn(`Token refresh failed for user ${user.username || user.instagramId}: ${refreshErr.message}`);
        // Don't fail the request, just log the warning
      }
    }
    
    next();
  } catch (err) {
    logger.error(`Token refresh middleware error: ${err.message}`);
    // Don't fail the request, just continue
    next();
  }
};

module.exports = tokenRefreshMiddleware;