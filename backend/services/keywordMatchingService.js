const logger = require("../utils/logger");

class KeywordMatchingService {
  constructor() {
    // Different matching strategies
    this.matchingStrategies = {
      EXACT: 'exact',
      CONTAINS: 'contains',
      WORD_BOUNDARY: 'word_boundary',
      REGEX: 'regex'
    };
  }

  /**
   * Find matching keywords in comment text
   * @param {string} commentText - The comment text to analyze
   * @param {Array} keywords - Array of keyword objects
   * @param {string} strategy - Matching strategy to use
   * @returns {Array} - Array of matched keywords with scores
   */
  findMatches(commentText, keywords, strategy = this.matchingStrategies.CONTAINS) {
    if (!commentText || !keywords || keywords.length === 0) {
      return [];
    }

    const matches = [];
    const normalizedComment = commentText.toLowerCase().trim();

    for (const keyword of keywords) {
      if (!keyword.keyword || !keyword.isActive) continue;

      const normalizedKeyword = keyword.keyword.toLowerCase().trim();
      let isMatch = false;
      let matchScore = 0;

      switch (strategy) {
        case this.matchingStrategies.EXACT:
          isMatch = normalizedComment === normalizedKeyword;
          matchScore = isMatch ? 1.0 : 0;
          break;

        case this.matchingStrategies.CONTAINS:
          isMatch = normalizedComment.includes(normalizedKeyword);
          matchScore = isMatch ? this.calculateContainsScore(normalizedComment, normalizedKeyword) : 0;
          break;

        case this.matchingStrategies.WORD_BOUNDARY:
          const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(normalizedKeyword)}\\b`, 'i');
          isMatch = wordBoundaryRegex.test(normalizedComment);
          matchScore = isMatch ? 0.9 : 0;
          break;

        case this.matchingStrategies.REGEX:
          try {
            const regex = new RegExp(normalizedKeyword, 'i');
            isMatch = regex.test(normalizedComment);
            matchScore = isMatch ? 0.8 : 0;
          } catch (regexError) {
            logger.warn(`Invalid regex pattern for keyword ${keyword.keyword}: ${regexError.message}`);
            // Fallback to contains strategy
            isMatch = normalizedComment.includes(normalizedKeyword);
            matchScore = isMatch ? 0.5 : 0;
          }
          break;

        default:
          isMatch = normalizedComment.includes(normalizedKeyword);
          matchScore = isMatch ? 0.7 : 0;
      }

      if (isMatch) {
        matches.push({
          keyword: keyword,
          matchScore: matchScore,
          matchedText: this.extractMatchedText(commentText, normalizedKeyword),
          strategy: strategy
        });
      }
    }

    // Sort by match score (highest first) and keyword priority
    return matches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // If scores are equal, prioritize by keyword creation date (newer first)
      return new Date(b.keyword.createdAt) - new Date(a.keyword.createdAt);
    });
  }

  /**
   * Get the best matching keyword for a comment
   * @param {string} commentText - The comment text to analyze
   * @param {Array} keywords - Array of keyword objects
   * @param {string} strategy - Matching strategy to use
   * @returns {Object|null} - Best matching keyword or null
   */
  getBestMatch(commentText, keywords, strategy = this.matchingStrategies.CONTAINS) {
    const matches = this.findMatches(commentText, keywords, strategy);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Calculate score for contains matching
   * @param {string} text - Full text
   * @param {string} keyword - Keyword to match
   * @returns {number} - Score between 0 and 1
   */
  calculateContainsScore(text, keyword) {
    const keywordLength = keyword.length;
    const textLength = text.length;
    
    // Higher score for longer keywords relative to text length
    const lengthRatio = keywordLength / textLength;
    
    // Higher score if keyword appears at the beginning
    const positionScore = text.indexOf(keyword) === 0 ? 0.2 : 0;
    
    // Base score for containing the keyword
    const baseScore = 0.6;
    
    return Math.min(1.0, baseScore + (lengthRatio * 0.2) + positionScore);
  }

  /**
   * Extract the matched text from the original comment
   * @param {string} originalText - Original comment text
   * @param {string} keyword - Matched keyword
   * @returns {string} - Extracted matched text
   */
  extractMatchedText(originalText, keyword) {
    const lowerText = originalText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerText.indexOf(lowerKeyword);
    
    if (index === -1) return keyword;
    
    return originalText.substring(index, index + keyword.length);
  }

  /**
   * Escape special regex characters
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Analyze comment sentiment (basic implementation)
   * @param {string} commentText - Comment text to analyze
   * @returns {Object} - Sentiment analysis result
   */
  analyzeSentiment(commentText) {
    const positiveWords = ['good', 'great', 'awesome', 'love', 'amazing', 'excellent', 'fantastic', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disgusting', 'annoying'];
    
    const words = commentText.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    let sentiment = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    return {
      sentiment,
      positiveCount,
      negativeCount,
      confidence: Math.abs(positiveCount - negativeCount) / words.length
    };
  }

  /**
   * Check if comment should be ignored (spam detection)
   * @param {string} commentText - Comment text to check
   * @returns {boolean} - True if comment should be ignored
   */
  shouldIgnoreComment(commentText) {
    if (!commentText || commentText.trim().length === 0) return true;
    
    // Ignore very short comments
    if (commentText.trim().length < 2) return true;
    
    // Ignore comments that are mostly emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const textWithoutEmojis = commentText.replace(emojiRegex, '').trim();
    // Порог 2: двухсимвольные комментарии ('ab') ещё могут содержать
    // короткий keyword, игнорируем только совсем пустые/одиночные.
    if (textWithoutEmojis.length < 2) return true;
    
    // Ignore comments with excessive repetition
    const words = commentText.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 5 && uniqueWords.size / words.length < 0.3) return true;
    
    return false;
  }
}

module.exports = new KeywordMatchingService();