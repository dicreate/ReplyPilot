const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mediaController = require('../../controllers/mediaController');
const instagramService = require('../../services/instagramService');
const User = require('../../models/User');
const Keyword = require('../../models/Keyword');
const ProcessedComment = require('../../models/ProcessedComment');

jest.mock('../../services/instagramService');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const app = express();
app.use(express.json());

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/media/process/:mediaId', authMiddleware, mediaController.processMediaComments);
app.get('/media/history', authMiddleware, mediaController.getProcessingHistory);

describe('Media Controller processMediaComments sinceHours', () => {
  let testUser;
  let authToken;
  const MEDIA_ID = '17906088048591873';

  const comment = (id, text, timestamp) => ({
    id,
    text,
    from: { id: '111', username: 'commenter' },
    timestamp
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = new User({
      facebookId: 'mc-1',
      instagramId: 'mc-1',
      accessToken: 'test-token',
      username: 'mediauser'
    });
    await testUser.save();
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);

    await Keyword.create({ userId: testUser._id, keyword: 'hello', message: 'Hi!' });

    instagramService.fetchComments.mockResolvedValue({ success: true, data: [] });
    instagramService.resolveResponseMessage.mockResolvedValue({ text: 'Hi!', quickReplies: null });
    instagramService.sendDirectMessage.mockResolvedValue({ success: true });
  });

  it('should process all comments when sinceHours not provided (all time)', async () => {
    instagramService.fetchComments.mockResolvedValue({
      success: true,
      data: [
        comment('c1', 'hello there', new Date().toISOString()),
        comment('c2', 'hello old', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
      ]
    });

    const response = await request(app)
      .post(`/media/process/${MEDIA_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.newComments).toBe(2);
    expect(response.body.data.dmsSent).toBe(2);
    expect(response.body.data.skippedByAge).toBe(0);
  });

  it('should skip comments older than sinceHours without records', async () => {
    instagramService.fetchComments.mockResolvedValue({
      success: true,
      data: [
        comment('c1', 'hello fresh', new Date().toISOString()),
        comment('c2', 'hello ancient', new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString())
      ]
    });

    const response = await request(app)
      .post(`/media/process/${MEDIA_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sinceHours: 48 });

    expect(response.status).toBe(200);
    expect(response.body.data.newComments).toBe(1);
    expect(response.body.data.dmsSent).toBe(1);
    expect(response.body.data.skippedByAge).toBe(1);
    // Скипнутый не пишется в базу — широкий прогон подберет позже
    expect(await ProcessedComment.findOne({ commentId: 'c2' })).toBeNull();
    expect(await ProcessedComment.findOne({ commentId: 'c1' })).toBeTruthy();
  });

  it('should process comments without timestamp (fail-open)', async () => {
    instagramService.fetchComments.mockResolvedValue({
      success: true,
      data: [{ id: 'c1', text: 'hello no ts', from: { id: '111', username: 'commenter' } }]
    });

    const response = await request(app)
      .post(`/media/process/${MEDIA_ID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ sinceHours: 24 });

    expect(response.status).toBe(200);
    expect(response.body.data.dmsSent).toBe(1);
    expect(response.body.data.skippedByAge).toBe(0);
  });

  it('should return 400 for invalid sinceHours', async () => {
    for (const bad of ['abc', -5, 0]) {
      const response = await request(app)
        .post(`/media/process/${MEDIA_ID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sinceHours: bad });

      expect(response.status).toBe(400);
    }
  });

  describe('GET /media/history storage info', () => {
    it('should return retention panel (total, oldest, ttlDays)', async () => {
      await ProcessedComment.create([
        {
          userId: testUser._id,
          commentId: 'h1',
          mediaId: MEDIA_ID,
          commentText: 'old one',
          commentAuthor: 'a',
          commentAuthorId: '1',
          processedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000)
        },
        {
          userId: testUser._id,
          commentId: 'h2',
          mediaId: MEDIA_ID,
          commentText: 'new one',
          commentAuthor: 'b',
          commentAuthorId: '2'
        }
      ]);

      const response = await request(app)
        .get('/media/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.storage.total).toBe(2);
      expect(new Date(response.body.data.storage.oldestProcessedAt).getTime())
        .toBeLessThan(Date.now() - 9 * 24 * 3600 * 1000);
      expect(response.body.data.storage.ttlDays).toBe(90);
    });
  });
});
