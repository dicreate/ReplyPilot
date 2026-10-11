const instagramService = require('../../services/instagramService');

jest.mock('axios');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const axios = require('axios');

describe('DM fallback age gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    instagramService.rateLimitDelay = 0;
    delete process.env.FALLBACK_MAX_COMMENT_AGE_HOURS;
  });

  describe('isFallbackAllowed', () => {
    it('should allow when timestamp is missing (fail-open)', () => {
      expect(instagramService.isFallbackAllowed(null)).toBe(true);
      expect(instagramService.isFallbackAllowed(undefined)).toBe(true);
    });

    it('should allow fresh comments', () => {
      expect(instagramService.isFallbackAllowed(new Date().toISOString())).toBe(true);
      expect(instagramService.isFallbackAllowed(Date.now())).toBe(true);
      expect(instagramService.isFallbackAllowed(Math.floor(Date.now() / 1000))).toBe(true);
    });

    it('should block comments older than 48h by default', () => {
      const old = new Date(Date.now() - 49 * 3600 * 1000).toISOString();
      expect(instagramService.isFallbackAllowed(old)).toBe(false);
    });

    it('should allow comments within 48h', () => {
      const recent = new Date(Date.now() - 47 * 3600 * 1000).toISOString();
      expect(instagramService.isFallbackAllowed(recent)).toBe(true);
    });

    it('should respect FALLBACK_MAX_COMMENT_AGE_HOURS env', () => {
      process.env.FALLBACK_MAX_COMMENT_AGE_HOURS = '1';
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(instagramService.isFallbackAllowed(twoHoursAgo)).toBe(false);
    });

    it('should allow unparseable timestamps (fail-open)', () => {
      expect(instagramService.isFallbackAllowed('not-a-date')).toBe(true);
    });
  });

  describe('sendDirectMessage with old comment', () => {
    const OLD_TS = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

    it('should skip /me/messages fallback for old comment after private reply fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('An unknown error has occurred.'));

      const result = await instagramService.sendDirectMessage(
        '2057553475647220', 'hi', 'token', 'owner1', 'comment1', null, OLD_TS
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('fallback skipped');
      // Только private reply, без второго вызова /me/messages
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should still use fallback for fresh comment after private reply fails', async () => {
      axios.post
        .mockRejectedValueOnce(new Error('An unknown error has occurred.'))
        .mockResolvedValueOnce({ data: { message_id: 'mid1' } });

      const result = await instagramService.sendDirectMessage(
        '2057553475647220', 'hi', 'token', 'owner1', 'comment1', null, new Date().toISOString()
      );

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should send private reply normally when it succeeds (no fallback needed)', async () => {
      axios.post.mockResolvedValueOnce({ data: { message_id: 'reply1' } });

      const result = await instagramService.sendDirectMessage(
        '2057553475647220', 'hi', 'token', 'owner1', 'comment1', null, OLD_TS
      );

      expect(result.success).toBe(true);
      expect(result.type).toBe('private_reply');
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
