const User = require('../../models/User');
const mongoose = require('mongoose');

describe('User Model', () => {
  describe('Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-access-token',
        username: 'testuser'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.instagramId).toBe('12345');
      expect(savedUser.accessToken).toBe('test-access-token');
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.isActive).toBe(true); // Default value
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require facebookId', async () => {
      const user = new User({
        instagramId: '12345',
        accessToken: 'test-token'
      });

      await expect(user.save()).rejects.toThrow('facebookId');
    });

    it('should require accessToken', async () => {
      const user = new User({
        facebookId: 'fb-12345',
        instagramId: '12345'
      });

      await expect(user.save()).rejects.toThrow('accessToken');
    });

    it('should enforce unique facebookId', async () => {
      const userData = {
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-token'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should allow unique email addresses', async () => {
      const user1 = new User({
        facebookId: 'fb-1',
        instagramId: '12345',
        accessToken: 'token1',
        email: 'user1@example.com'
      });
      await user1.save();

      const user2 = new User({
        facebookId: 'fb-2',
        instagramId: '67890',
        accessToken: 'token2',
        email: 'user2@example.com'
      });
      await user2.save();

      expect(user1.email).toBe('user1@example.com');
      expect(user2.email).toBe('user2@example.com');
    });

    it('should enforce unique email addresses', async () => {
      const user1 = new User({
        facebookId: 'fb-1',
        instagramId: '12345',
        accessToken: 'token1',
        email: 'same@example.com'
      });
      await user1.save();

      const user2 = new User({
        facebookId: 'fb-2',
        instagramId: '67890',
        accessToken: 'token2',
        email: 'same@example.com'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should allow users without email addresses', async () => {
      // NB: поле email опущено, а не null — sparse+unique индекс в Mongo
      // считает явный null значением и падает дублем, а отсутствующее
      // поле пропускает. Прод-код email тоже не выставляет, а опускает.
      const user1 = new User({
        facebookId: 'fb-1',
        instagramId: '12345',
        accessToken: 'token1'
      });
      await user1.save();

      const user2 = new User({
        facebookId: 'fb-2',
        instagramId: '67890',
        accessToken: 'token2'
      });
      await user2.save();

      expect(user1.email).toBeUndefined();
      expect(user2.email).toBeUndefined();
    });
  });

  describe('Pre-save middleware', () => {
    it('should update updatedAt on save', async () => {
      const user = new User({
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-token'
      });

      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      savedUser.username = 'updated-username';
      const updatedUser = await savedUser.save();

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Default values', () => {
    it('should set default values correctly', async () => {
      const user = new User({
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-token'
      });

      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });
  });

  describe('Optional fields', () => {
    it('should save user with all optional fields', async () => {
      const userData = {
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        username: 'testuser',
        email: 'test@example.com',
        profilePicture: 'https://example.com/pic.jpg',
        lastLogin: new Date()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.refreshToken).toBe('refresh-token');
      expect(savedUser.tokenExpiresAt).toBeDefined();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.profilePicture).toBe('https://example.com/pic.jpg');
      expect(savedUser.lastLogin).toBeDefined();
    });
  });

  describe('Field types', () => {
    it('should handle Date fields correctly', async () => {
      const now = new Date();
      const user = new User({
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-token',
        tokenExpiresAt: now,
        lastLogin: now
      });

      const savedUser = await user.save();

      expect(savedUser.tokenExpiresAt).toBeInstanceOf(Date);
      expect(savedUser.lastLogin).toBeInstanceOf(Date);
      expect(savedUser.createdAt).toBeInstanceOf(Date);
      expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle Boolean fields correctly', async () => {
      const user = new User({
        facebookId: 'fb-12345',
        instagramId: '12345',
        accessToken: 'test-token',
        isActive: false
      });

      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(false);
      expect(typeof savedUser.isActive).toBe('boolean');
    });
  });
});