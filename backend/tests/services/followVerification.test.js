const instagramService = require('../../services/instagramService');
const mongoose = require('mongoose');

describe('Follow Verification with Quick Reply Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveResponseMessage with Quick Reply', () => {
    it('should include quickReplies button when user is not following and enableFollowCheckButton is true', async () => {
      const keyword = {
        _id: new mongoose.Types.ObjectId('64f1a2b3c4d5e6f7a8b9c0d1'),
        keyword: 'promo',
        message: 'Here is your 20% discount code!',
        messageForNonFollowers: 'Please follow us to get the promo code!',
        enableFollowCheckButton: true,
        followButtonText: '✅ Я подписался',
      };

      // Mock isFollower to return false (not following)
      jest.spyOn(instagramService, 'isFollower').mockResolvedValue(false);

      const resolved = await instagramService.resolveResponseMessage(
        keyword,
        { username: 'testuser', keyword: 'promo' },
        'user123',
        'token123'
      );

      expect(resolved.isFollower).toBe(false);
      expect(resolved.text).toBe('Please follow us to get the promo code!');
      expect(resolved.quickReplies).toBeDefined();
      expect(Array.isArray(resolved.quickReplies)).toBe(true);
      expect(resolved.quickReplies).toHaveLength(1);
      expect(resolved.quickReplies[0]).toEqual({
        content_type: 'text',
        title: '✅ Я подписался',
        payload: 'CHECK_FOLLOW_64f1a2b3c4d5e6f7a8b9c0d1',
      });
    });

    it('should truncate followButtonText if longer than 20 characters', async () => {
      const keyword = {
        _id: new mongoose.Types.ObjectId('64f1a2b3c4d5e6f7a8b9c0d1'),
        keyword: 'promo',
        message: 'Main message',
        messageForNonFollowers: 'Non follower message',
        enableFollowCheckButton: true,
        followButtonText: 'This button text is way too long for Meta',
      };

      jest.spyOn(instagramService, 'isFollower').mockResolvedValue(false);

      const resolved = await instagramService.resolveResponseMessage(
        keyword,
        { username: 'testuser', keyword: 'promo' },
        'user123',
        'token123'
      );

      expect(resolved.quickReplies[0].title.length).toBeLessThanOrEqual(20);
    });

    it('should NOT include quickReplies button if enableFollowCheckButton is false', async () => {
      const keyword = {
        _id: new mongoose.Types.ObjectId('64f1a2b3c4d5e6f7a8b9c0d1'),
        keyword: 'promo',
        message: 'Here is your discount code!',
        messageForNonFollowers: 'Please subscribe first!',
        enableFollowCheckButton: false,
      };

      jest.spyOn(instagramService, 'isFollower').mockResolvedValue(false);

      const resolved = await instagramService.resolveResponseMessage(
        keyword,
        { username: 'testuser', keyword: 'promo' },
        'user123',
        'token123'
      );

      expect(resolved.isFollower).toBe(false);
      expect(resolved.quickReplies).toBeNull();
    });

    it('should return main message without quickReplies if user is already a follower', async () => {
      const keyword = {
        _id: new mongoose.Types.ObjectId('64f1a2b3c4d5e6f7a8b9c0d1'),
        keyword: 'promo',
        message: 'Here is your discount code!',
        messageForNonFollowers: 'Please subscribe first!',
        enableFollowCheckButton: true,
      };

      jest.spyOn(instagramService, 'isFollower').mockResolvedValue(true);

      const resolved = await instagramService.resolveResponseMessage(
        keyword,
        { username: 'testuser', keyword: 'promo' },
        'user123',
        'token123'
      );

      expect(resolved.isFollower).toBe(true);
      expect(resolved.text).toBe('Here is your discount code!');
      expect(resolved.quickReplies).toBeNull();
    });
  });
});
