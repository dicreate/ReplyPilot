const request = require('supertest');
const express = require('express');
const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const app = express();
app.use(express.json());
app.post('/auth/instagram', authController.instagramLogin);
app.get('/auth/user', (req, res, next) => {
  // Mock auth middleware
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}, authController.getCurrentUser);

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/instagram', () => {
    it('should successfully authenticate with valid code', async () => {
      const mockInstagramResponse = {
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

      axios.post.mockResolvedValueOnce(mockInstagramResponse);
      axios.get.mockResolvedValueOnce(mockExchangeResponse);
      axios.get.mockResolvedValueOnce(mockProfileResponse);
      axios.get.mockResolvedValueOnce(mockPagesResponse);

      const response = await request(app)
        .post('/auth/instagram')
        .send({ code: 'valid-auth-code' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');

      // Verify user was saved to database
      const savedUser = await User.findOne({ instagramId: '12345' });
      expect(savedUser).toBeTruthy();
      expect(savedUser.username).toBe('testuser');
    });

    it('should return 400 when no code is provided', async () => {
      const response = await request(app)
        .post('/auth/instagram')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Authorization code is required');
    });

    it('should handle Instagram API errors', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: { message: 'Invalid authorization code' } }
        }
      });

      const response = await request(app)
        .post('/auth/instagram')
        .send({ code: 'invalid-code' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Login failed');
    });

    it('should update existing user on re-authentication', async () => {
      // Create existing user
      const existingUser = new User({
        facebookId: '12345',
        instagramId: '12345',
        accessToken: 'old-token',
        username: 'oldusername'
      });
      await existingUser.save();

      const mockInstagramResponse = {
        data: {
          access_token: 'new-access-token',
          user_id: '12345'
        }
      };

      const mockExchangeResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 5184000
        }
      };

      const mockProfileResponse = {
        data: {
          id: '12345',
          username: 'newusername'
        }
      };

      const mockPagesResponse = {
        data: {
          data: []
        }
      };

      axios.post.mockResolvedValueOnce(mockInstagramResponse);
      axios.get.mockResolvedValueOnce(mockExchangeResponse);
      axios.get.mockResolvedValueOnce(mockProfileResponse);
      axios.get.mockResolvedValueOnce(mockPagesResponse);

      const response = await request(app)
        .post('/auth/instagram')
        .send({ code: 'valid-auth-code' });

      expect(response.status).toBe(200);

      // Verify user was updated
      const updatedUser = await User.findOne({ instagramId: '12345' });
      expect(updatedUser.accessToken).toBe('new-access-token');
      expect(updatedUser.username).toBe('newusername');
    });

    it('should handle parallel logins without duplicate key errors', async () => {
      // Regression: фронт присылал callback дважды (StrictMode), два
      // параллельных findOne + save падали со вторым E11000.
      axios.post.mockResolvedValue({
        data: {
          access_token: 'race-token',
          user_id: '99999'
        }
      });
      axios.get.mockImplementation((url) => {
        if (url.includes('access_token')) {
          return Promise.resolve({ data: { access_token: 'race-long-token', expires_in: 5184000 } });
        }
        if (url.includes('/me/accounts')) {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: { id: '99999', username: 'raceuser' } });
      });

      const [first, second] = await Promise.all([
        request(app).post('/auth/instagram').send({ code: 'code-1' }),
        request(app).post('/auth/instagram').send({ code: 'code-2' })
      ]);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);

      const count = await User.countDocuments({ facebookId: '99999' });
      expect(count).toBe(1);
    });
  });

  describe('GET /auth/user', () => {
    it('should return current user info with valid token', async () => {
      // Create test user
      const user = new User({
        facebookId: '12345',
        instagramId: '12345',
        accessToken: 'test-token',
        username: 'testuser',
        email: 'test@example.com'
      });
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body).not.toHaveProperty('accessToken'); // Should not expose access token
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 401 with no token', async () => {
      const response = await request(app)
        .get('/auth/user');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token');
    });

    it('should return 404 when user not found', async () => {
      // Generate token for non-existent user
      const mongoose = require('mongoose');
      const fakeUserId = new mongoose.Types.ObjectId();
      const token = jwt.sign({ id: fakeUserId }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});