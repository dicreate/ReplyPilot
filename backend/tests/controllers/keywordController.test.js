const request = require('supertest');
const express = require('express');
const keywordController = require('../../controllers/keywordController');
const Keyword = require('../../models/Keyword');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// messageProcessor намеренно не мокаем: он чистый (строки без внешних
// зависимостей), а resetMocks в jest-конфиге затирал бы реализации моков.

const app = express();
app.use(express.json());

// Mock auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.get('/keywords', authMiddleware, keywordController.getKeywords);
app.post('/keywords', authMiddleware, keywordController.addKeyword);
app.put('/keywords/:id', authMiddleware, keywordController.updateKeyword);
app.delete('/keywords/:id', authMiddleware, keywordController.deleteKeyword);
app.get('/keywords/placeholders', authMiddleware, keywordController.getPlaceholders);
app.post('/keywords/preview', authMiddleware, keywordController.previewMessage);

describe('Keyword Controller', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      facebookId: '12345',
      instagramId: '12345',
      accessToken: 'test-token',
      username: 'testuser'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
  });

  describe('GET /keywords', () => {
    it('should return user keywords', async () => {
      // Create test keywords (explicit createdAt: same-ms saves sort unstable)
      const keyword1 = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi {followername}!',
        isActive: true,
        createdAt: new Date(Date.now() - 1000)
      });
      const keyword2 = new Keyword({
        userId: testUser._id,
        keyword: 'thanks',
        message: 'Thank you!',
        isActive: true,
        createdAt: new Date()
      });
      await keyword1.save();
      await keyword2.save();

      const response = await request(app)
        .get('/keywords')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].keyword).toBe('thanks'); // Should be sorted by createdAt desc
    });

    it('should return empty array when no keywords exist', async () => {
      const response = await request(app)
        .get('/keywords')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should only return active keywords', async () => {
      const activeKeyword = new Keyword({
        userId: testUser._id,
        keyword: 'active',
        message: 'Active message',
        isActive: true
      });
      const inactiveKeyword = new Keyword({
        userId: testUser._id,
        keyword: 'inactive',
        message: 'Inactive message',
        isActive: false
      });
      await activeKeyword.save();
      await inactiveKeyword.save();

      const response = await request(app)
        .get('/keywords')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].keyword).toBe('active');
    });
  });

  describe('POST /keywords', () => {
    it('should create a new keyword', async () => {
      const keywordData = {
        keyword: 'hello',
        message: 'Hi {followername}!'
      };

      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send(keywordData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.keyword).toBe('hello');
      expect(response.body.data.message).toBe('Hi {followername}!');

      // Verify keyword was saved to database
      const savedKeyword = await Keyword.findOne({ keyword: 'hello', userId: testUser._id });
      expect(savedKeyword).toBeTruthy();
    });

    it('should return 400 when keyword is missing', async () => {
      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Test message' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword and message are required');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword and message are required');
    });

    it('should return 409 when keyword already exists', async () => {
      // Create existing keyword
      const existingKeyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Existing message',
        isActive: true
      });
      await existingKeyword.save();

      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'hello', message: 'New message' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should normalize keyword to lowercase', async () => {
      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'HELLO', message: 'Test message' });

      expect(response.status).toBe(201);
      expect(response.body.data.keyword).toBe('hello');
    });

    it('should store mediaIds for post-scoped keyword', async () => {
      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'scoped', message: 'Test message', mediaIds: ['17906088048591873'] });

      expect(response.status).toBe(201);
      expect(response.body.data.mediaIds).toEqual(['17906088048591873']);
    });

    it('should default mediaIds to empty array (global) when not provided', async () => {
      const response = await request(app)
        .post('/keywords')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'glob', message: 'Test message' });

      expect(response.status).toBe(201);
      expect(response.body.data.mediaIds).toEqual([]);
    });
  });

  describe('PUT /keywords/:id', () => {
    let testKeyword;

    beforeEach(async () => {
      testKeyword = new Keyword({
        userId: testUser._id,
        keyword: 'original',
        message: 'Original message',
        isActive: true
      });
      await testKeyword.save();
    });

    it('should update an existing keyword', async () => {
      const updateData = {
        keyword: 'updated',
        message: 'Updated message'
      };

      const response = await request(app)
        .put(`/keywords/${testKeyword._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.keyword).toBe('updated');
      expect(response.body.data.message).toBe('Updated message');

      // Verify keyword was updated in database
      const updatedKeyword = await Keyword.findById(testKeyword._id);
      expect(updatedKeyword.keyword).toBe('updated');
      expect(updatedKeyword.message).toBe('Updated message');
    });

    it('should return 404 when keyword not found', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/keywords/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'test', message: 'test message' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword not found');
    });

    it('should return 409 when updating to existing keyword', async () => {
      // Create another keyword
      const anotherKeyword = new Keyword({
        userId: testUser._id,
        keyword: 'existing',
        message: 'Existing message',
        isActive: true
      });
      await anotherKeyword.save();

      const response = await request(app)
        .put(`/keywords/${testKeyword._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'existing', message: 'Updated message' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should update post scope when mediaIds provided', async () => {
      const response = await request(app)
        .put(`/keywords/${testKeyword._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'original', message: 'Original message', mediaIds: ['17906088048591873'] });

      expect(response.status).toBe(200);
      expect(response.body.data.mediaIds).toEqual(['17906088048591873']);
    });

    it('should preserve post scope when mediaIds not provided (old clients)', async () => {
      testKeyword.mediaIds = ['17906088048591873'];
      await testKeyword.save();

      const response = await request(app)
        .put(`/keywords/${testKeyword._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ keyword: 'original', message: 'Changed message' });

      expect(response.status).toBe(200);
      expect(response.body.data.mediaIds).toEqual(['17906088048591873']);
    });
  });

  describe('DELETE /keywords/:id', () => {
    let testKeyword;

    beforeEach(async () => {
      testKeyword = new Keyword({
        userId: testUser._id,
        keyword: 'test',
        message: 'Test message',
        isActive: true
      });
      await testKeyword.save();
    });

    it('should soft delete a keyword', async () => {
      const response = await request(app)
        .delete(`/keywords/${testKeyword._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Keyword deleted successfully');

      // Verify keyword was soft deleted
      const deletedKeyword = await Keyword.findById(testKeyword._id);
      expect(deletedKeyword.isActive).toBe(false);
    });

    it('should return 404 when keyword not found', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/keywords/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword not found');
    });
  });

  describe('GET /keywords/placeholders', () => {
    it('should return available placeholders', async () => {
      const response = await request(app)
        .get('/keywords/placeholders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('{followername}');
      expect(response.body.data).toHaveProperty('{keyword}');
    });
  });

  describe('POST /keywords/preview', () => {
    it('should preview a message with placeholders', async () => {
      const response = await request(app)
        .post('/keywords/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello {followername}!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preview).toBe('Hello john_doe!');
    });

    it('should return 400 when message is missing', async () => {
      const response = await request(app)
        .post('/keywords/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message is required for preview');
    });
  });
});