const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Keyword = require('../../models/Keyword');
const jwt = require('jsonwebtoken');

// Mock axios for Instagram API calls
jest.mock('axios');
const axios = require('axios');

// instagramService ходит в Meta через axios(config) (не axios.get),
// поэтому мокаем сервис целиком, а не axios.
jest.mock('../../services/instagramService');
const instagramService = require('../../services/instagramService');

describe('API Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      facebookId: '12345',
      instagramId: '12345',
      accessToken: 'test-instagram-token',
      username: 'testuser',
      email: 'test@example.com'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);

    // Reset axios mocks
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Mock Instagram OAuth response
      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          user_id: '67890'
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
          id: '67890',
          username: 'newuser'
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

      // Step 1: Instagram login
      const loginResponse = await request(app)
        .post('/api/auth/instagram')
        .send({ code: 'valid-auth-code' });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.username).toBe('newuser');

      const newToken = loginResponse.body.token;

      // Step 2: Access protected route with new token
      const userResponse = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${newToken}`);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.username).toBe('newuser');
      expect(userResponse.body.instagramId).toBe('67890');
    });

    it('should handle authentication errors properly', async () => {
      // Mock Instagram API error
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: { message: 'Invalid authorization code' } }
        }
      });

      const response = await request(app)
        .post('/api/auth/instagram')
        .send({ code: 'invalid-code' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Login failed');
    });
  });

  describe('Keyword Management Flow', () => {
    it('should complete full keyword CRUD operations', async () => {
      // Step 1: Create keyword
      const createResponse = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'hello',
          message: 'Hi {followername}!'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const keywordId = createResponse.body.data._id;

      // Step 2: Get keywords
      const getResponse = await request(app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toHaveLength(1);
      expect(getResponse.body.data[0].keyword).toBe('hello');

      // Step 3: Update keyword
      const updateResponse = await request(app)
        .put(`/api/keywords/${keywordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'hi',
          message: 'Hello {followername}!'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.keyword).toBe('hi');

      // Step 4: Delete keyword
      const deleteResponse = await request(app)
        .delete(`/api/keywords/${keywordId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Step 5: Verify deletion
      const finalGetResponse = await request(app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalGetResponse.body.data).toHaveLength(0);
    });

    it('should handle keyword validation errors', async () => {
      // Try to create keyword without message
      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword and message are required');
    });

    it('should prevent duplicate keywords', async () => {
      // Create first keyword
      await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'duplicate',
          message: 'First message'
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'duplicate',
          message: 'Second message'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Media Processing Flow', () => {
    beforeEach(async () => {
      // Create test keywords
      await Keyword.create([
        {
          userId: testUser._id,
          keyword: 'hello',
          message: 'Hi {followername}!',
          isActive: true
        },
        {
          userId: testUser._id,
          keyword: 'thanks',
          message: 'You\'re welcome!',
          isActive: true
        }
      ]);
    });

    it('should process media comments successfully', async () => {
      // Mock Instagram API responses
      const mockCommentsResponse = {
        data: {
          data: [
            {
              id: 'comment1',
              text: 'Hello there!',
              username: 'user1',
              timestamp: '2023-01-01T00:00:00Z'
            },
            {
              id: 'comment2',
              text: 'Thanks for sharing!',
              username: 'user2',
              timestamp: '2023-01-01T01:00:00Z'
            }
          ]
        }
      };

      instagramService.fetchComments.mockResolvedValueOnce({
        success: true,
        data: mockCommentsResponse.data.data
      });
      instagramService.resolveResponseMessage.mockImplementation(async (keyword, context) => ({
        text: `Reply about ${keyword.keyword}`,
        isFollower: null,
        quickReplies: null
      }));
      instagramService.sendDirectMessage.mockResolvedValue({ success: true, messageId: 'msg_1' });

      const response = await request(app)
        .post('/api/media/process/12345')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalComments).toBe(2);
      expect(response.body.data.keywordMatches).toBe(2);
      expect(response.body.data.dmsSent).toBe(2);
    });

    it('should handle Instagram API errors during processing', async () => {
      // Mock Instagram API error
      axios.get.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: { message: 'Invalid media ID' } }
        }
      });

      const response = await request(app)
        .post('/api/media/process/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid media ID');
    });

    it('should get recent media successfully', async () => {
      // Mock Instagram API response
      const mockMediaResponse = {
        data: {
          data: [
            {
              id: '12345',
              caption: 'Test post',
              media_type: 'IMAGE',
              media_url: 'https://example.com/image.jpg',
              timestamp: '2023-01-01T00:00:00Z',
              comments_count: 5
            }
          ]
        }
      };

      instagramService.fetchRecentMedia.mockResolvedValueOnce({
        success: true,
        data: mockMediaResponse.data.data
      });

      const response = await request(app)
        .get('/api/media/recent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('12345');
    });
  });

  describe('Analytics Flow', () => {
    it('should get analytics summary', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalDmsSent');
      expect(response.body.data).toHaveProperty('totalCommentsProcessed');
      expect(response.body.data).toHaveProperty('successRate');
    });

    it('should get keyword analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/keywords')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('keywordStats');
      expect(response.body.data).toHaveProperty('recentMatches');
    });

    it('should get timeline analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/timeline?days=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('timeline');
      expect(response.body.data.timeline).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/keywords');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token, authorization denied');
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Cross-feature Integration', () => {
    it('should integrate keyword creation with media processing', async () => {
      // Step 1: Create keyword
      await request(app)
        .post('/api/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: 'integration',
          message: 'Integration test message for {followername}'
        });

      // Step 2: Mock comment with keyword
      const mockCommentsResponse = {
        data: {
          data: [
            {
              id: 'integration-comment',
              text: 'This is an integration test',
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
        text: 'Integration reply',
        isFollower: null,
        quickReplies: null
      });
      instagramService.sendDirectMessage.mockResolvedValue({ success: true, messageId: 'msg_1' });

      // Step 3: Process media (numeric id — иначе сработает валидатор формата)
      const processResponse = await request(app)
        .post('/api/media/process/123456789')
        .set('Authorization', `Bearer ${authToken}`);

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.data.keywordMatches).toBe(1);

      // Step 4: Check analytics updated
      const analyticsResponse = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(analyticsResponse.body.data.totalKeywordMatches).toBeGreaterThan(0);
    });
  });

  // В САМОМ КОНЦЕ: strictLimiter (100/15 мин) общий на процесс —
  // после этого теста все /api/media и /api/comments отвечают 429.
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // generalLimiter в test-окружении — 1000, его тестом не достичь.
      // Бьём в strictLimiter (/api/media — 100 в test-окружении).
      const requests = Array(105).fill().map(() =>
        request(app)
          .post('/api/media/process/123456789')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});