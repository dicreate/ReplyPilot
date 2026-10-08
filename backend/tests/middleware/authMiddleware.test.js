const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');
const User = require('../../models/User');

const app = express();
app.use(express.json());

// Test route with auth middleware
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    userId: req.user.id,
    userDoc: req.userDoc ? req.userDoc.username : null
  });
});

describe('Auth Middleware', () => {
  let testUser;
  let validToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      facebookId: '12345',
      instagramId: '12345',
      accessToken: 'test-token',
      username: 'testuser',
      isActive: true
    });
    await testUser.save();

    // Generate valid token
    validToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
  });

  describe('Valid authentication', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBe(testUser._id.toString());
      expect(response.body.userDoc).toBe('testuser');
    });

    it('should attach user and userDoc to request', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.userDoc).toBe('testuser');
    });
  });

  describe('Invalid authentication', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token, authorization denied');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token expired');
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject request for non-existent user', async () => {
      const mongoose = require('mongoose');
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeToken = jwt.sign({ id: fakeUserId }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User not found or inactive');
    });

    it('should reject request for inactive user', async () => {
      // Deactivate user
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('User not found or inactive');
    });
  });

  describe('Token format handling', () => {
    it('should accept valid token without Bearer prefix (prefix-tolerant)', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', validToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle malformed Authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should handle empty Authorization header', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', '');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token, authorization denied');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Authentication error');

      // Restore original method
      User.findById = originalFindById;
    });
  });
});