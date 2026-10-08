const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Keyword = require('../../models/Keyword');
const ProcessedComment = require('../../models/ProcessedComment');
const Analytics = require('../../models/Analytics');
const jwt = require('jsonwebtoken');

// Mock axios for Instagram API calls
jest.mock('axios');
const axios = require('axios');

// instagramService ходит в Meta через axios(config) (не axios.get),
// поэтому мокаем сервис целиком, а не axios.
jest.mock('../../services/instagramService');
const instagramService = require('../../services/instagramService');

describe('End-to-End Workflow Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Keyword.deleteMany({});
    await ProcessedComment.deleteMany({});
    await Analytics.deleteMany({});

    jest.clearAllMocks();
  });

  describe('Complete User Workflow', () => {
    it('should complete full user journey from registration to DM automation', async () => {
      // Step 1: User Authentication
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          user_id: '12345'
        }
      };

      const mockExchangeResponse = {
        data: {
          access_token: 'long-lived-token',
          expires_in: 5184000
        }
      };

      const mockProfileResponse = {
        data: {
          id: '12345',
          username: 'testuser'
        }
      };

      const mockPagesResponse = {
        data: {
          data: []
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);
      axios.get.mockResolvedValueOnce(mockExchangeResponse);
      axios.get.mockResolvedValueOnce(mockProfileResponse);
      axios.get.mockResolvedValueOnce(mockPagesResponse);

      const authResponse = await request(app)
        .post('/api/auth/instagram')
        .send({ code: 'valid-auth-code' });

      expect(authResponse.status).toBe(200);
      expect(authResponse.body).toHaveProperty('token');
      expect(authResponse.body.user.username).toBe('testuser');

      const token = authResponse.body.token;

      // Step 2: Verify user was created
      const userResponse = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${token}`);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.username).toBe('testuser');

      // Step 3: Create keywords
      const keyword1Response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'hello',
          message: 'Hi {followername}! Thanks for saying hello!'
        });

      expect(keyword1Response.status).toBe(201);
      expect(keyword1Response.body.success).toBe(true);

      const keyword2Response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'thanks',
          message: 'You\'re welcome, {followername}!'
        });

      expect(keyword2Response.status).toBe(201);

      // Step 4: Verify keywords were created
      const keywordsResponse = await request(app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${token}`);

      expect(keywordsResponse.status).toBe(200);
      expect(keywordsResponse.body.data).toHaveLength(2);

      // Step 5: Mock Instagram comments and process media
      const mockCommentsResponse = {
        data: {
          data: [
            {
              id: 'comment1',
              text: 'Hello there! Love your content',
              username: 'follower1',
              timestamp: '2023-01-01T00:00:00Z'
            },
            {
              id: 'comment2',
              text: 'Thanks for sharing this!',
              username: 'follower2',
              timestamp: '2023-01-01T01:00:00Z'
            },
            {
              id: 'comment3',
              text: 'Great post!',
              username: 'follower3',
              timestamp: '2023-01-01T02:00:00Z'
            }
          ]
        }
      };

      instagramService.fetchComments.mockResolvedValueOnce({
        success: true,
        data: mockCommentsResponse.data.data
      });
      instagramService.resolveResponseMessage.mockImplementation(async (keyword, context) => ({
        text: `Hi ${context.username}! Thanks for saying ${keyword.keyword}!`,
        isFollower: null,
        quickReplies: null
      }));
      instagramService.sendDirectMessage.mockResolvedValue({ success: true, messageId: 'msg_1' });

      const processResponse = await request(app)
        .post('/api/media/process/123456789')
        .set('Authorization', `Bearer ${token}`);

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.success).toBe(true);
      expect(processResponse.body.data.totalComments).toBe(3);
      expect(processResponse.body.data.keywordMatches).toBe(2); // hello and thanks
      expect(processResponse.body.data.dmsSent).toBe(2);

      // Step 6: Verify processed comments were stored
      const user = await User.findOne({ username: 'testuser' });
      const processedComments = await ProcessedComment.find({ userId: user._id });
      expect(processedComments).toHaveLength(3);

      const matchedComments = processedComments.filter(c => c.keywordMatched);
      expect(matchedComments).toHaveLength(2);

      // Step 7: Verify analytics were updated
      const analyticsResponse = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.data.totalDmsSent).toBe(2);
      expect(analyticsResponse.body.data.totalCommentsProcessed).toBe(3);
      expect(analyticsResponse.body.data.totalKeywordMatches).toBe(2);

      // Step 8: Check keyword analytics
      const keywordAnalyticsResponse = await request(app)
        .get('/api/analytics/keywords')
        .set('Authorization', `Bearer ${token}`);

      expect(keywordAnalyticsResponse.status).toBe(200);
      expect(keywordAnalyticsResponse.body.data.keywordStats).toHaveLength(2);

      // Step 9: Verify keywords were updated with match counts
      const updatedKeywordsResponse = await request(app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${token}`);

      const updatedKeywords = updatedKeywordsResponse.body.data;
      const helloKeyword = updatedKeywords.find(k => k.keyword === 'hello');
      const thanksKeyword = updatedKeywords.find(k => k.keyword === 'thanks');

      expect(helloKeyword.matchCount).toBe(1);
      expect(thanksKeyword.matchCount).toBe(1);

      // Step 10: Test processing history
      const historyResponse = await request(app)
        .get('/api/media/history')
        .set('Authorization', `Bearer ${token}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.data.history).toHaveLength(3);
    });

    it('should handle error scenarios gracefully', async () => {
      // Create authenticated user
      const user = new User({
        facebookId: '12345',
        instagramId: '12345',
        accessToken: 'test-token',
        username: 'testuser'
      });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      // Test with invalid media ID
      axios.get.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: { message: 'Invalid media ID' } }
        }
      });

      const errorResponse = await request(app)
        .post('/api/media/process/invalid-media')
        .set('Authorization', `Bearer ${token}`);

      expect(errorResponse.status).toBe(400);
      expect(errorResponse.body.message).toContain('Invalid media ID');

      // Test with expired token (numeric id — иначе сработает валидатор формата)
      instagramService.fetchComments.mockResolvedValueOnce({
        success: false,
        status: 401,
        error: 'Access token expired or invalid'
      });

      const expiredTokenResponse = await request(app)
        .post('/api/media/process/123456789')
        .set('Authorization', `Bearer ${token}`);

      expect(expiredTokenResponse.status).toBe(401);
      expect(expiredTokenResponse.body.message).toContain('access token expired');
    });

  });

  describe('System Health and Monitoring', () => {
    it('should provide health check endpoints', async () => {
      // Basic health check
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.success).toBe(true);

      // Detailed health check
      const detailedHealthResponse = await request(app).get('/health/detailed');
      expect(detailedHealthResponse.status).toBe(200);
      expect(detailedHealthResponse.body.data).toHaveProperty('checks');

      // Readiness check
      const readinessResponse = await request(app).get('/health/ready');
      expect(readinessResponse.status).toBe(200);

      // Liveness check
      const livenessResponse = await request(app).get('/health/live');
      expect(livenessResponse.status).toBe(200);

      // Metrics
      const metricsResponse = await request(app).get('/health/metrics');
      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body.data).toHaveProperty('uptime');
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      const user = new User({
        facebookId: '12345',
        instagramId: '12345',
        accessToken: 'test-token',
        username: 'testuser'
      });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      // Create keyword
      await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'test',
          message: 'Test message'
        });

      // Process comments
      const mockCommentsResponse = {
        data: {
          data: [
            {
              id: 'test-comment',
              text: 'This is a test comment',
              username: 'testuser',
              timestamp: '2023-01-01T00:00:00Z'
            }
          ]
        }
      };

      instagramService.fetchComments.mockResolvedValueOnce({
        success: true,
        data: mockCommentsResponse.data.data
      });
      instagramService.resolveResponseMessage.mockResolvedValue({
        text: 'Test reply',
        isFollower: null,
        quickReplies: null
      });
      instagramService.sendDirectMessage.mockResolvedValue({ success: true, messageId: 'msg_1' });

      await request(app)
        .post('/api/media/process/123456789')
        .set('Authorization', `Bearer ${token}`);

      // Verify data consistency
      const keywords = await Keyword.find({ userId: user._id });
      const processedComments = await ProcessedComment.find({ userId: user._id });
      const analytics = await Analytics.find({ userId: user._id });

      expect(keywords).toHaveLength(1);
      expect(processedComments).toHaveLength(1);
      expect(analytics).toHaveLength(1);

      // Verify keyword match count
      expect(keywords[0].matchCount).toBe(1);

      // Verify analytics totals
      expect(analytics[0].commentsProcessed).toBe(1);
      expect(analytics[0].keywordMatches).toBe(1);
      expect(analytics[0].dmsSent).toBe(1);
    });
  });

  describe('Security and Validation', () => {
    it('should prevent unauthorized access', async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .get('/api/keywords');

      expect(noTokenResponse.status).toBe(401);

      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/keywords')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidTokenResponse.status).toBe(401);
    });

    it('should validate input data', async () => {
      const user = new User({
        facebookId: '12345',
        instagramId: '12345',
        accessToken: 'test-token',
        username: 'testuser'
      });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      // Test invalid keyword data
      const invalidKeywordResponse = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${token}`)
        .send({ keyword: '' });

      expect(invalidKeywordResponse.status).toBe(400);

      // Test invalid media ID
      const invalidMediaResponse = await request(app)
        .post('/api/media/process/invalid-id-format')
        .set('Authorization', `Bearer ${token}`);

      expect(invalidMediaResponse.status).toBe(400);
    });
  });

  // В САМОМ КОНЦЕ: strictLimiter (100/15 мин) общий на процесс —
  // после этого теста все /api/media и /api/comments отвечают 429.
  describe('Rate Limiting', () => {
    it('should handle rate limiting correctly', async () => {
      const user = new User({
        facebookId: '12345',
        instagramId: '12345',
        accessToken: 'test-token',
        username: 'testuser'
      });
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      // strictLimiter в test-окружении — 100 запросов на 15 мин,
      // поэтому для срабатывания нужно больше сотни.
      const requests = Array(105).fill().map(() =>
        request(app)
          .post('/api/media/process/test-media')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});