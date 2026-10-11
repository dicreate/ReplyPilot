const mongoose = require('mongoose');
const ProcessedComment = require('../../models/ProcessedComment');

describe('ProcessedComment Model', () => {
  const userId = new mongoose.Types.ObjectId();

  it('should create a processed comment record', async () => {
    const rec = await ProcessedComment.create({
      userId,
      commentId: 'c123',
      mediaId: 'm123',
      commentText: 'test',
      commentAuthor: 'someone',
      commentAuthorId: '999',
      dmSent: true
    });

    expect(rec._id).toBeDefined();
    expect(rec.dmSent).toBe(true);
    expect(rec.processedAt).toBeInstanceOf(Date);
  });

  it('should enforce unique commentId (dedup)', async () => {
    await ProcessedComment.create({
      userId,
      commentId: 'dup1',
      mediaId: 'm123',
      commentText: 'test',
      commentAuthor: 'someone',
      commentAuthorId: '999'
    });

    await expect(ProcessedComment.create({
      userId,
      commentId: 'dup1',
      mediaId: 'm123',
      commentText: 'test again',
      commentAuthor: 'someone',
      commentAuthorId: '999'
    })).rejects.toThrow();
  });

  it('should have 90-day TTL index on processedAt', async () => {
    const indexes = await ProcessedComment.collection.listIndexes().toArray();
    const ttl = indexes.find((ix) => ix.key && ix.key.processedAt === 1);

    expect(ttl).toBeDefined();
    expect(ttl.expireAfterSeconds).toBe(90 * 24 * 60 * 60);
  });
});
