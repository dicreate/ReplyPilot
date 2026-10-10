const Keyword = require('../../models/Keyword');
const User = require('../../models/User');
const mongoose = require('mongoose');

describe('Keyword Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      facebookId: 'fb-12345',
      instagramId: '12345',
      accessToken: 'test-token',
      username: 'testuser'
    });
    await testUser.save();
  });

  describe('Validation', () => {
    it('should create a valid keyword', async () => {
      const keywordData = {
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!'
      };

      const keyword = new Keyword(keywordData);
      const savedKeyword = await keyword.save();

      expect(savedKeyword._id).toBeDefined();
      expect(savedKeyword.userId.toString()).toBe(testUser._id.toString());
      expect(savedKeyword.keyword).toBe('hello');
      expect(savedKeyword.message).toBe('Hi there!');
      expect(savedKeyword.isActive).toBe(true); // Default value
      expect(savedKeyword.matchCount).toBe(0); // Default value
      expect(savedKeyword.createdAt).toBeDefined();
      expect(savedKeyword.updatedAt).toBeDefined();
    });

    it('should require userId', async () => {
      const keyword = new Keyword({
        keyword: 'hello',
        message: 'Hi there!'
      });

      await expect(keyword.save()).rejects.toThrow('userId');
    });

    it('should require keyword', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        message: 'Hi there!'
      });

      await expect(keyword.save()).rejects.toThrow('keyword');
    });

    it('should require message', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello'
      });

      await expect(keyword.save()).rejects.toThrow('message');
    });

    it('should validate userId as ObjectId', async () => {
      const keyword = new Keyword({
        userId: 'invalid-id',
        keyword: 'hello',
        message: 'Hi there!'
      });

      await expect(keyword.save()).rejects.toThrow();
    });
  });

  describe('Default values', () => {
    it('should set default values correctly', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!'
      });

      const savedKeyword = await keyword.save();

      expect(savedKeyword.isActive).toBe(true);
      expect(savedKeyword.matchCount).toBe(0);
      expect(savedKeyword.createdAt).toBeDefined();
      expect(savedKeyword.updatedAt).toBeDefined();
      expect(savedKeyword.lastUsed).toBeUndefined();
    });
  });

  describe('Pre-save middleware', () => {
    it('should update updatedAt on save', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!'
      });

      const savedKeyword = await keyword.save();
      const originalUpdatedAt = savedKeyword.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      savedKeyword.message = 'Updated message';
      const updatedKeyword = await savedKeyword.save();

      expect(updatedKeyword.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Optional fields', () => {
    it('should save keyword with all optional fields', async () => {
      const keywordData = {
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!',
        isActive: false,
        matchCount: 5,
        lastUsed: new Date()
      };

      const keyword = new Keyword(keywordData);
      const savedKeyword = await keyword.save();

      expect(savedKeyword.isActive).toBe(false);
      expect(savedKeyword.matchCount).toBe(5);
      expect(savedKeyword.lastUsed).toBeDefined();
    });
  });

  describe('Field types', () => {
    it('should handle Number fields correctly', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!',
        matchCount: 10
      });

      const savedKeyword = await keyword.save();

      expect(savedKeyword.matchCount).toBe(10);
      expect(typeof savedKeyword.matchCount).toBe('number');
    });

    it('should handle Boolean fields correctly', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!',
        isActive: false
      });

      const savedKeyword = await keyword.save();

      expect(savedKeyword.isActive).toBe(false);
      expect(typeof savedKeyword.isActive).toBe('boolean');
    });

    it('should handle Date fields correctly', async () => {
      const now = new Date();
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!',
        lastUsed: now
      });

      const savedKeyword = await keyword.save();

      expect(savedKeyword.lastUsed).toBeInstanceOf(Date);
      expect(savedKeyword.createdAt).toBeInstanceOf(Date);
      expect(savedKeyword.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should reference User correctly', async () => {
      const keyword = new Keyword({
        userId: testUser._id,
        keyword: 'hello',
        message: 'Hi there!'
      });

      const savedKeyword = await keyword.save();
      const populatedKeyword = await Keyword.findById(savedKeyword._id).populate('userId');

      expect(populatedKeyword.userId.username).toBe('testuser');
      expect(populatedKeyword.userId.instagramId).toBe('12345');
    });
  });

  describe('Indexes', () => {
    it('should have compound index on userId, keyword, and isActive', async () => {
      const indexes = await Keyword.collection.getIndexes();
      
      // Check if compound index exists
      const hasCompoundIndex = Object.keys(indexes).some(indexName => {
        const index = indexes[indexName];
        return index.some(field => 
          field[0] === 'userId' || field[0] === 'keyword' || field[0] === 'isActive'
        );
      });

      expect(hasCompoundIndex).toBe(true);
    });
  });

  describe('Query operations', () => {
    beforeEach(async () => {
      // Create test keywords (explicit createdAt: same-ms saves sort unstable)
      await Keyword.create([
        {
          userId: testUser._id,
          keyword: 'hello',
          message: 'Hi!',
          isActive: true,
          matchCount: 5,
          createdAt: new Date(Date.now() - 1000)
        },
        {
          userId: testUser._id,
          keyword: 'thanks',
          message: 'Welcome!',
          isActive: true,
          matchCount: 3,
          createdAt: new Date()
        },
        {
          userId: testUser._id,
          keyword: 'inactive',
          message: 'Inactive',
          isActive: false,
          matchCount: 1
        }
      ]);
    });

    it('should find active keywords only', async () => {
      const activeKeywords = await Keyword.find({ 
        userId: testUser._id, 
        isActive: true 
      });

      expect(activeKeywords).toHaveLength(2);
      expect(activeKeywords.every(k => k.isActive)).toBe(true);
    });

    it('should sort by creation date', async () => {
      const keywords = await Keyword.find({ 
        userId: testUser._id, 
        isActive: true 
      }).sort({ createdAt: -1 });

      expect(keywords).toHaveLength(2);
      expect(keywords[0].keyword).toBe('thanks'); // Created later
      expect(keywords[1].keyword).toBe('hello');
    });

    it('should sort by match count', async () => {
      const keywords = await Keyword.find({ 
        userId: testUser._id, 
        isActive: true 
      }).sort({ matchCount: -1 });

      expect(keywords).toHaveLength(2);
      expect(keywords[0].keyword).toBe('hello'); // Higher match count
      expect(keywords[1].keyword).toBe('thanks');
    });
  });

  describe('findForMedia (post scoping)', () => {
    const POST_A = '17906088048591873';
    const POST_B = '18059718371551555';

    beforeEach(async () => {
      // Глобальный (mediaIds по умолчанию пустой)
      await Keyword.create({ userId: testUser._id, keyword: 'global', message: 'G' });
      // Легаси-запись без поля mediaIds вообще (старые документы в прод-БД)
      await Keyword.collection.insertOne({ userId: testUser._id, keyword: 'legacy', message: 'L', isActive: true });
      await Keyword.create({ userId: testUser._id, keyword: 'scoped-a', message: 'A', mediaIds: [POST_A] });
      await Keyword.create({ userId: testUser._id, keyword: 'scoped-b', message: 'B', mediaIds: [POST_B] });
      await Keyword.create({ userId: testUser._id, keyword: 'scoped-off', message: 'X', mediaIds: [POST_A], isActive: false });
    });

    const names = (docs) => docs.map((k) => k.keyword).sort();

    it('should return global + legacy + matching scoped keywords for a post', async () => {
      expect(names(await Keyword.findForMedia(testUser._id, POST_A))).toEqual(['global', 'legacy', 'scoped-a']);
      expect(names(await Keyword.findForMedia(testUser._id, POST_B))).toEqual(['global', 'legacy', 'scoped-b']);
    });

    it('should return only global keywords for unknown media', async () => {
      expect(names(await Keyword.findForMedia(testUser._id, 'unknown'))).toEqual(['global', 'legacy']);
    });

    it('should not return other users keywords', async () => {
      const other = new User({ facebookId: 'fb-999', instagramId: '999', accessToken: 't', username: 'other' });
      await other.save();
      await Keyword.create({ userId: other._id, keyword: 'other-global', message: 'O' });
      expect(names(await Keyword.findForMedia(testUser._id, POST_A))).toEqual(['global', 'legacy', 'scoped-a']);
    });
  });
});