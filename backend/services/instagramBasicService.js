const axios = require('axios');
const logger = require('../utils/logger');

class InstagramBasicService {
  
  /**
   * Get user's Instagram media (posts)
   */
  async getUserMedia(accessToken, limit = 25) {
    try {
      const response = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${accessToken}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching user media: ${JSON.stringify(error.response?.data)}`);
      throw error;
    }
  }

  /**
   * Get specific media details
   */
  async getMediaDetails(mediaId, accessToken) {
    try {
      const response = await axios.get(`https://graph.instagram.com/${mediaId}?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${accessToken}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching media details: ${JSON.stringify(error.response?.data)}`);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching user profile: ${JSON.stringify(error.response?.data)}`);
      throw error;
    }
  }

  /**
   * Note: Instagram Basic Display API does NOT support:
   * - Reading comments on posts
   * - Posting comments
   * - Managing messages/DMs
   * 
   * For these features, you need Instagram Business API with a Facebook Page
   */
  
  /**
   * Simulate comment processing for Basic Display API
   * This would need to be implemented differently since Basic Display doesn't support comments
   */
  async processMediaForKeywords(media, keywords, userId) {
    logger.warn('Comment processing not available with Instagram Basic Display API');
    logger.info('To process comments, you need Instagram Business API with a Facebook Page');
    return [];
  }
}

module.exports = new InstagramBasicService();