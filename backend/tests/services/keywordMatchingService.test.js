const keywordMatchingService = require('../../services/keywordMatchingService');

describe('Keyword Matching Service', () => {
  const mockKeywords = [
    {
      _id: '1',
      keyword: 'hello',
      message: 'Hi there!',
      isActive: true,
      createdAt: new Date('2023-01-01')
    },
    {
      _id: '2',
      keyword: 'thanks',
      message: 'You\'re welcome!',
      isActive: true,
      createdAt: new Date('2023-01-02')
    },
    {
      _id: '3',
      keyword: 'help',
      message: 'How can I help?',
      isActive: true,
      createdAt: new Date('2023-01-03')
    },
    {
      _id: '4',
      keyword: 'inactive',
      message: 'Inactive message',
      isActive: false,
      createdAt: new Date('2023-01-04')
    }
  ];

  describe('findMatches', () => {
    it('should find matching keywords using contains strategy', () => {
      const commentText = 'Hello there, thanks for the post!';
      const matches = keywordMatchingService.findMatches(commentText, mockKeywords);

      expect(matches).toHaveLength(2);
      expect(matches[0].keyword.keyword).toBe('hello');
      expect(matches[1].keyword.keyword).toBe('thanks');
      expect(matches[0].matchScore).toBeGreaterThan(0);
    });

    it('should find matches case-insensitively', () => {
      const commentText = 'HELLO WORLD';
      const matches = keywordMatchingService.findMatches(commentText, mockKeywords);

      expect(matches).toHaveLength(1);
      expect(matches[0].keyword.keyword).toBe('hello');
    });

    it('should not match inactive keywords', () => {
      const commentText = 'This is inactive content';
      const matches = keywordMatchingService.findMatches(commentText, mockKeywords);

      expect(matches).toHaveLength(0);
    });

    it('should return empty array for empty comment', () => {
      const matches = keywordMatchingService.findMatches('', mockKeywords);
      expect(matches).toHaveLength(0);
    });

    it('should return empty array for null comment', () => {
      const matches = keywordMatchingService.findMatches(null, mockKeywords);
      expect(matches).toHaveLength(0);
    });

    it('should return empty array for empty keywords', () => {
      const matches = keywordMatchingService.findMatches('hello world', []);
      expect(matches).toHaveLength(0);
    });

    it('should sort matches by score and creation date', () => {
      const commentText = 'hello thanks help';
      const matches = keywordMatchingService.findMatches(commentText, mockKeywords);

      expect(matches).toHaveLength(3);
      // Sorted by match score first ('hello' wins: position bonus + length),
      // then by creation date (newer first) on ties.
      expect(matches.map(m => m.keyword.keyword)).toEqual(['hello', 'thanks', 'help']);
    });

    it('should prefer newer keywords when scores are equal', () => {
      const commentText = 'x abc def';
      const tieKeywords = [
        { _id: '1', keyword: 'abc', message: 'm', isActive: true, createdAt: new Date('2023-01-01') },
        { _id: '2', keyword: 'def', message: 'm', isActive: true, createdAt: new Date('2023-01-02') }
      ];
      const matches = keywordMatchingService.findMatches(commentText, tieKeywords);

      expect(matches).toHaveLength(2);
      expect(matches[0].matchScore).toBe(matches[1].matchScore);
      expect(matches.map(m => m.keyword.keyword)).toEqual(['def', 'abc']);
    });
  });

  describe('getBestMatch', () => {
    it('should return the best matching keyword', () => {
      const commentText = 'Hello there, thanks for the post!';
      const bestMatch = keywordMatchingService.getBestMatch(commentText, mockKeywords);

      expect(bestMatch).toBeTruthy();
      expect(bestMatch.keyword.keyword).toBe('hello');
      expect(bestMatch.matchScore).toBeGreaterThan(0);
    });

    it('should return null when no matches found', () => {
      const commentText = 'No matching keywords here';
      const bestMatch = keywordMatchingService.getBestMatch(commentText, mockKeywords);

      expect(bestMatch).toBeNull();
    });
  });

  describe('word boundary matching', () => {
    it('should match whole words only with word boundary strategy', () => {
      const keywords = [
        { keyword: 'cat', message: 'Meow!', isActive: true, createdAt: new Date() }
      ];

      // Should match 'cat' as whole word
      const matches1 = keywordMatchingService.findMatches(
        'I love my cat',
        keywords,
        keywordMatchingService.matchingStrategies.WORD_BOUNDARY
      );
      expect(matches1).toHaveLength(1);

      // Should not match 'cat' within 'category'
      const matches2 = keywordMatchingService.findMatches(
        'Check this category',
        keywords,
        keywordMatchingService.matchingStrategies.WORD_BOUNDARY
      );
      expect(matches2).toHaveLength(0);
    });
  });

  describe('exact matching', () => {
    it('should match exact text only', () => {
      const keywords = [
        { keyword: 'hello', message: 'Hi!', isActive: true, createdAt: new Date() }
      ];

      // Should match exact text
      const matches1 = keywordMatchingService.findMatches(
        'hello',
        keywords,
        keywordMatchingService.matchingStrategies.EXACT
      );
      expect(matches1).toHaveLength(1);

      // Should not match partial text
      const matches2 = keywordMatchingService.findMatches(
        'hello world',
        keywords,
        keywordMatchingService.matchingStrategies.EXACT
      );
      expect(matches2).toHaveLength(0);
    });
  });

  describe('shouldIgnoreComment', () => {
    it('should ignore empty comments', () => {
      expect(keywordMatchingService.shouldIgnoreComment('')).toBe(true);
      expect(keywordMatchingService.shouldIgnoreComment('   ')).toBe(true);
      expect(keywordMatchingService.shouldIgnoreComment(null)).toBe(true);
    });

    it('should ignore very short comments', () => {
      expect(keywordMatchingService.shouldIgnoreComment('a')).toBe(true);
      expect(keywordMatchingService.shouldIgnoreComment('ab')).toBe(false);
    });

    it('should ignore comments with excessive repetition', () => {
      const repetitiveComment = 'spam spam spam spam spam spam';
      expect(keywordMatchingService.shouldIgnoreComment(repetitiveComment)).toBe(true);
    });

    it('should not ignore normal comments', () => {
      expect(keywordMatchingService.shouldIgnoreComment('This is a normal comment')).toBe(false);
    });
  });

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const result = keywordMatchingService.analyzeSentiment('This is great and amazing!');
      expect(result.sentiment).toBe('positive');
      expect(result.positiveCount).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const result = keywordMatchingService.analyzeSentiment('This is terrible and awful!');
      expect(result.sentiment).toBe('negative');
      expect(result.negativeCount).toBeGreaterThan(0);
    });

    it('should detect neutral sentiment', () => {
      const result = keywordMatchingService.analyzeSentiment('This is a normal comment');
      expect(result.sentiment).toBe('neutral');
    });

    it('should calculate confidence score', () => {
      const result = keywordMatchingService.analyzeSentiment('great amazing wonderful');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('calculateContainsScore', () => {
    it('should give higher score for longer keywords', () => {
      const score1 = keywordMatchingService.calculateContainsScore('hello world', 'hello');
      const score2 = keywordMatchingService.calculateContainsScore('hello world', 'hello world');
      expect(score2).toBeGreaterThan(score1);
    });

    it('should give higher score for keywords at the beginning', () => {
      const score1 = keywordMatchingService.calculateContainsScore('hello world', 'hello');
      const score2 = keywordMatchingService.calculateContainsScore('world hello', 'hello');
      expect(score1).toBeGreaterThan(score2);
    });

    it('should return score between 0 and 1', () => {
      const score = keywordMatchingService.calculateContainsScore('hello world', 'hello');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('extractMatchedText', () => {
    it('should extract matched text preserving original case', () => {
      const extracted = keywordMatchingService.extractMatchedText('Hello World', 'hello');
      expect(extracted).toBe('Hello');
    });

    it('should return keyword if not found', () => {
      const extracted = keywordMatchingService.extractMatchedText('goodbye', 'hello');
      expect(extracted).toBe('hello');
    });
  });

  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      const escaped = keywordMatchingService.escapeRegex('hello.world+test*');
      expect(escaped).toBe('hello\\.world\\+test\\*');
    });

    it('should handle parentheses and brackets', () => {
      const escaped = keywordMatchingService.escapeRegex('test(group)[class]{set}');
      expect(escaped).toBe('test\\(group\\)\\[class\\]\\{set\\}');
    });
  });
});