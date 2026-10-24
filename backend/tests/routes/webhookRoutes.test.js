const request = require('supertest');
const crypto = require('crypto');
const app = require('../../app');
const User = require('../../models/User');
const Keyword = require('../../models/Keyword');
const ProcessedComment = require('../../models/ProcessedComment');

jest.mock('../../services/instagramService');
const instagramService = require('../../services/instagramService');

describe('Webhook Routes', () => {
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.WEBHOOK_VERIFY_TOKEN = 'my_local_verify_token_123';
    process.env.INSTAGRAM_CLIENT_SECRET = 'test-client-secret';

    testUser = new User({
      facebookId: '12345',
      instagramId: '17841448383305464',
      accessToken: 'test-user-token',
      username: 'dimay.developer',
      email: 'test@example.com',
    });
    await testUser.save();
  });

  describe('GET /webhook/instagram (Verification)', () => {
    it('should verify webhook with correct verify token', async () => {
      const response = await request(app)
        .get('/webhook/instagram')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'my_local_verify_token_123',
          'hub.challenge': 'challenge_code_12345',
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe('challenge_code_12345');
    });

    it('should reject webhook verification with invalid token', async () => {
      const response = await request(app)
        .get('/webhook/instagram')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': 'challenge_code_12345',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /webhook/instagram (Events)', () => {
    function signPayload(bodyString) {
      return (
        'sha256=' +
        crypto
          .createHmac('sha256', process.env.INSTAGRAM_CLIENT_SECRET)
          .update(bodyString)
          .digest('hex')
      );
    }

    it('should reject webhook events with missing signature', async () => {
      const response = await request(app)
        .post('/webhook/instagram')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ object: 'instagram', entry: [] }));

      expect(response.status).toBe(401);
    });

    it('should successfully process comment event and send DM with button template', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'vitest',
        message: 'Here is your vitest guide!',
        buttons: [
          { type: 'url', title: 'Open link', url: 'https://example.com' }
        ],
        isActive: true,
      });
      await keyword.save();

      const mockButtons = [{ type: 'web_url', title: 'Open link', url: 'https://example.com' }];
      instagramService.resolveResponseMessage.mockResolvedValueOnce({
        text: 'Here is your vitest guide!',
        isFollower: true,
        quickReplies: null,
        buttons: mockButtons,
      });

      instagramService.sendDirectMessage.mockResolvedValueOnce({
        success: true,
        messageId: 'mid.123',
      });

      const payload = {
        object: 'instagram',
        entry: [
          {
            id: '17841448383305464',
            time: 1792863970,
            changes: [
              {
                field: 'comments',
                value: {
                  id: '18168685627494600',
                  text: 'vitest',
                  from: {
                    id: '2057553475647220',
                    username: '_di_may',
                  },
                  media: {
                    id: '18116895665053875',
                    media_product_type: 'FEED',
                  },
                },
              },
            ],
          },
        ],
      };

      const payloadStr = JSON.stringify(payload);
      const signature = signPayload(payloadStr);

      const response = await request(app)
        .post('/webhook/instagram')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.text).toBe('EVENT_RECEIVED');

      expect(instagramService.resolveResponseMessage).toHaveBeenCalledTimes(1);
      expect(instagramService.sendDirectMessage).toHaveBeenCalledTimes(1);

      const record = await ProcessedComment.findOne({ commentId: '18168685627494600' });
      expect(record).toBeDefined();
      expect(record.dmSent).toBe(true);
      expect(record.errorMessage).toBeUndefined();
    });

    it('should skip sending DM when no keyword matches', async () => {
      const payload = {
        object: 'instagram',
        entry: [
          {
            id: '17841448383305464',
            time: 1792863970,
            changes: [
              {
                field: 'comments',
                value: {
                  id: '9999999999',
                  text: 'unmatched random comment',
                  from: {
                    id: '2057553475647220',
                    username: '_di_may',
                  },
                  media: {
                    id: '18116895665053875',
                    media_product_type: 'FEED',
                  },
                },
              },
            ],
          },
        ],
      };

      const payloadStr = JSON.stringify(payload);
      const signature = signPayload(payloadStr);

      const response = await request(app)
        .post('/webhook/instagram')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(instagramService.sendDirectMessage).not.toHaveBeenCalled();

      const record = await ProcessedComment.findOne({ commentId: '9999999999' });
      expect(record).toBeDefined();
      expect(record.dmSent).toBe(false);
    });

    it('should handle button postback and send next funnel step message (ChatPlace style)', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'консультация',
        message: 'Привет! Чем могу помочь?',
        buttons: [
          { type: 'postback', title: 'Что входит?', payload: 'step_details' }
        ],
        steps: [
          {
            id: 'step_details',
            name: 'Что входит в консультацию',
            message: 'В консультацию входит полный разбор и план действий!',
            buttons: [
              { type: 'url', title: 'Telegram', url: 'https://t.me/my_bot' }
            ]
          }
        ],
        isActive: true,
      });
      await keyword.save();

      instagramService.sendDirectMessage.mockResolvedValueOnce({
        success: true,
        messageId: 'mid.step_details',
      });

      const postbackPayload = {
        object: 'instagram',
        entry: [
          {
            id: '17841448383305464',
            messaging: [
              {
                sender: { id: '2057553475647220' },
                recipient: { id: '17841448383305464' },
                timestamp: 1792864000,
                postback: {
                  title: 'Что входит?',
                  payload: `STEP_${keyword._id}_step_details`
                }
              }
            ]
          }
        ]
      };

      const payloadStr = JSON.stringify(postbackPayload);
      const signature = signPayload(payloadStr);

      const response = await request(app)
        .post('/webhook/instagram')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payloadStr);

      expect(response.status).toBe(200);
      expect(response.text).toBe('EVENT_RECEIVED');

      expect(instagramService.sendDirectMessage).toHaveBeenCalledTimes(1);
      const [recipient, text, , , , , , buttons] = instagramService.sendDirectMessage.mock.calls[0];
      expect(recipient).toBe('2057553475647220');
      expect(text).toBe('В консультацию входит полный разбор и план действий!');
      expect(buttons).toEqual([
        { type: 'url', title: 'Telegram', url: 'https://t.me/my_bot', payload: '' }
      ]);
    });
  });
});
