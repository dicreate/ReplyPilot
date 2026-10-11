const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const analyticsController = require('../../controllers/analyticsController');
const Analytics = require('../../models/Analytics');
const User = require('../../models/User');

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

app.get('/summary', authMiddleware, analyticsController.getAnalyticsSummary);

describe('Analytics Controller getAnalyticsSummary', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = new User({
      facebookId: 'an-1',
      instagramId: 'an-1',
      accessToken: 'test-token',
      username: 'analyticsuser'
    });
    await testUser.save();
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
  });

  it('should calculate success rate as sent/matches (not sent/processed)', async () => {
    await Analytics.create({
      userId: testUser._id,
      date: new Date(),
      dmsSent: 17,
      commentsProcessed: 32,
      keywordMatches: 19,
      errorCount: 2
    });

    const response = await request(app)
      .get('/summary?days=30')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.totalDmsSent).toBe(17);
    expect(response.body.data.totalKeywordMatches).toBe(19);
    // 17/19=89.5, а не 17/32=53.1
    expect(response.body.data.successRate).toBe(89.5);
  });

  it('should return 0 success rate when no matches', async () => {
    await Analytics.create({
      userId: testUser._id,
      date: new Date(),
      dmsSent: 0,
      commentsProcessed: 5,
      keywordMatches: 0,
      errorCount: 0
    });

    const response = await request(app)
      .get('/summary?days=30')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.successRate).toBe(0);
  });
});
