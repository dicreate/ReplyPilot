const instagramService = require('../../services/instagramService');

jest.mock('axios');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const axios = require('axios');

describe('Button template (Stage 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    instagramService.rateLimitDelay = 0;
  });

  describe('normalizeButtons', () => {
    it('should map url/postback buttons to Meta format', () => {
      const out = instagramService.normalizeButtons([
        { title: 'Открыть пост', type: 'url', url: 'https://t.me/x' },
        { title: 'Telegram', type: 'postback', payload: 'STEP_TG' }
      ]);
      expect(out).toEqual([
        { type: 'web_url', title: 'Открыть пост', url: 'https://t.me/x' },
        { type: 'postback', title: 'Telegram', payload: 'STEP_TG' }
      ]);
    });

    it('should cap at 3 buttons and drop invalid ones', () => {
      const out = instagramService.normalizeButtons([
        { title: 'a', type: 'url', url: 'https://a.io' },
        { title: '', type: 'url', url: 'https://b.io' },
        { title: 'c', type: 'url', url: 'not-a-url' },
        { title: 'd', type: 'postback', payload: '' },
        { title: 'e', type: 'url', url: 'https://e.io' },
        { title: 'f', type: 'url', url: 'https://f.io' }
      ]);
      // Первые 3 по порядку: a валидна, остальные в окне невалидны
      expect(out).toEqual([{ type: 'web_url', title: 'a', url: 'https://a.io' }]);
    });

    it('should trim titles to 20 chars and return [] for empty input', () => {
      const out = instagramService.normalizeButtons([
        { title: '1234567890123456789012345', type: 'url', url: 'https://a.io' }
      ]);
      expect(out[0].title).toHaveLength(20);
      expect(instagramService.normalizeButtons(null)).toEqual([]);
      expect(instagramService.normalizeButtons([])).toEqual([]);
    });
  });

  describe('buildButtonTemplate', () => {
    it('should build button template payload and truncate text to 640', () => {
      const payload = instagramService.buildButtonTemplate(
        'x'.repeat(700),
        [{ type: 'web_url', title: 'Go', url: 'https://a.io' }]
      );
      expect(payload.attachment.type).toBe('template');
      expect(payload.attachment.payload.template_type).toBe('button');
      expect(payload.attachment.payload.text).toHaveLength(640);
      expect(payload.attachment.payload.buttons).toHaveLength(1);
    });
  });

  describe('sendDirectMessage with buttons', () => {
    it('should send button template via private reply (no IGSID needed)', async () => {
      axios.post.mockResolvedValueOnce({ data: { message_id: 'reply-tpl' } });

      const result = await instagramService.sendDirectMessage(
        '12345', 'Выбирай', 'token', 'owner1', 'comment1', null, new Date().toISOString(),
        [{ title: 'Открыть пост', type: 'url', url: 'https://t.me/x' }]
      );

      expect(result.success).toBe(true);
      expect(result.type).toBe('private_reply');
      // Один вызов — private reply с шаблоном, DM-fallback не нужен
      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body] = axios.post.mock.calls[0];
      expect(url).toContain('/owner1/messages');
      expect(body.recipient).toEqual({ comment_id: 'comment1' });
      expect(body.message.attachment.payload.template_type).toBe('button');
      expect(body.message.attachment.payload.buttons).toEqual([
        { type: 'web_url', title: 'Открыть пост', url: 'https://t.me/x' }
      ]);
    });

    it('should fall back to DM template when private reply fails', async () => {
      axios.post
        .mockRejectedValueOnce(new Error('An unknown error has occurred.'))
        .mockResolvedValueOnce({ data: { message_id: 'mid-tpl' } });

      const result = await instagramService.sendDirectMessage(
        '12345', 'Выбирай', 'token', 'owner1', 'comment1', null, new Date().toISOString(),
        [{ title: 'Открыть пост', type: 'url', url: 'https://t.me/x' }]
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(2);
      const [, body] = axios.post.mock.calls[1];
      expect(body.message.attachment.payload.template_type).toBe('button');
    });

    it('should still use private reply when no buttons', async () => {
      axios.post.mockResolvedValueOnce({ data: { message_id: 'reply1' } });

      const result = await instagramService.sendDirectMessage(
        '12345', 'hi', 'token', 'owner1', 'comment1', null, new Date().toISOString(), []
      );

      expect(result.success).toBe(true);
      expect(result.type).toBe('private_reply');
    });
  });

  describe('resolveResponseMessage', () => {
    it('should pass keyword buttons through', async () => {
      const resolved = await instagramService.resolveResponseMessage(
        { _id: 'k1', message: 'Hi {username}', buttons: [{ title: 'Go', type: 'url', url: 'https://a.io' }] },
        { username: 'u' },
        '999',
        'token'
      );
      expect(resolved.text).toContain('Hi');
      expect(resolved.buttons).toEqual([{ type: 'web_url', title: 'Go', url: 'https://a.io' }]);
    });
  });
});
