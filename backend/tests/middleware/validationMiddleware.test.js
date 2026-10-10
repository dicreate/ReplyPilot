const { validateKeyword } = require('../../middleware/validationMiddleware');

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

function runMiddleware(body) {
  const req = { body: { ...body } };
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
  const next = jest.fn();
  validateKeyword(req, res, next);
  return { req, res, next };
}

describe('validateKeyword mediaIds (post scoping)', () => {
  it('should pass through when mediaIds absent (global, backward compatible)', () => {
    const { req, next } = runMiddleware({ keyword: 'hi', message: 'Hello' });
    expect(next).toHaveBeenCalled();
    expect(req.body.mediaIds).toBeUndefined();
  });

  it('should accept valid post IDs and dedupe them', () => {
    const { req, next } = runMiddleware({
      keyword: 'hi',
      message: 'Hello',
      mediaIds: ['17906088048591873', ' 17906088048591873 ', '18059718371551555']
    });
    expect(next).toHaveBeenCalled();
    expect(req.body.mediaIds).toEqual(['17906088048591873', '18059718371551555']);
  });

  it('should accept empty array as global scope', () => {
    const { req, next } = runMiddleware({ keyword: 'hi', message: 'Hello', mediaIds: [] });
    expect(next).toHaveBeenCalled();
    expect(req.body.mediaIds).toEqual([]);
  });

  it('should reject non-array mediaIds', () => {
    const { res, next } = runMiddleware({ keyword: 'hi', message: 'Hello', mediaIds: '17906088048591873' });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('should reject non-numeric post IDs', () => {
    const { res, next } = runMiddleware({ keyword: 'hi', message: 'Hello', mediaIds: ['not-an-id'] });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.errors.mediaIds).toContain('not-an-id');
  });

  it('should reject more than 50 posts', () => {
    const ids = Array.from({ length: 51 }, (_, i) => String(17906088048591873 + i));
    const { res, next } = runMiddleware({ keyword: 'hi', message: 'Hello', mediaIds: ids });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});
