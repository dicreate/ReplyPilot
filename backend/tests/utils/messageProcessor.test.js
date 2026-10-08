const messageProcessor = require('../../utils/messageProcessor');

describe('Message Processor', () => {
  describe('processMessage', () => {
    it('should replace followername placeholder', () => {
      const message = 'Hello {followername}!';
      const context = { username: 'john_doe' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hello john_doe!');
    });

    it('should replace username placeholder (alias for followername)', () => {
      const message = 'Hi {username}!';
      const context = { username: 'jane_doe' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hi jane_doe!');
    });

    it('should replace keyword placeholder', () => {
      const message = 'Thanks for saying {keyword}!';
      const context = { keyword: 'hello' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Thanks for saying hello!');
    });

    it('should replace time and date placeholders', () => {
      const message = 'Current time: {time}, date: {date}';
      const result = messageProcessor.processMessage(message);
      
      expect(result).toContain('Current time:');
      expect(result).toContain('date:');
      expect(result).not.toContain('{time}');
      expect(result).not.toContain('{date}');
    });

    it('should replace multiple placeholders', () => {
      const message = 'Hi {username}! Thanks for {keyword}!';
      const context = { username: 'john', keyword: 'commenting' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hi john! Thanks for commenting!');
    });

    it('should handle case-insensitive placeholders', () => {
      const message = 'Hello {FOLLOWERNAME} and {Username}!';
      const context = { username: 'test_user' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hello test_user and test_user!');
    });

    it('should handle missing context gracefully', () => {
      const message = 'Hello {followername}!';
      const result = messageProcessor.processMessage(message);
      
      expect(result).toBe('Hello {followername}!');
    });

    it('should handle empty message', () => {
      const result = messageProcessor.processMessage('');
      expect(result).toBe('');
    });

    it('should handle null message', () => {
      const result = messageProcessor.processMessage(null);
      expect(result).toBeNull();
    });

    it('should return original message on error', () => {
      const originalMessage = 'Test message';
      
      // Mock an error in processing
      const originalReplace = String.prototype.replace;
      String.prototype.replace = jest.fn(() => {
        throw new Error('Test error');
      });

      const result = messageProcessor.processMessage(originalMessage);
      expect(result).toBe(originalMessage);

      // Restore original method
      String.prototype.replace = originalReplace;
    });
  });

  describe('getAvailablePlaceholders', () => {
    it('should return all available placeholders', () => {
      const placeholders = messageProcessor.getAvailablePlaceholders();
      
      expect(placeholders).toHaveProperty('{followername}');
      expect(placeholders).toHaveProperty('{username}');
      expect(placeholders).toHaveProperty('{keyword}');
      expect(placeholders).toHaveProperty('{time}');
      expect(placeholders).toHaveProperty('{date}');
    });

    it('should return descriptions for placeholders', () => {
      const placeholders = messageProcessor.getAvailablePlaceholders();
      
      expect(typeof placeholders['{followername}']).toBe('string');
      expect(placeholders['{followername}'].length).toBeGreaterThan(0);
    });
  });

  describe('validatePlaceholders', () => {
    it('should validate correct placeholders', () => {
      const message = 'Hello {followername}! Thanks for {keyword}!';
      const validation = messageProcessor.validatePlaceholders(message);
      
      expect(validation.valid).toBe(true);
      expect(validation.foundPlaceholders).toContain('{followername}');
      expect(validation.foundPlaceholders).toContain('{keyword}');
      expect(validation.invalidPlaceholders).toHaveLength(0);
    });

    it('should detect invalid placeholders', () => {
      const message = 'Hello {invalidplaceholder}!';
      const validation = messageProcessor.validatePlaceholders(message);
      
      expect(validation.valid).toBe(false);
      expect(validation.invalidPlaceholders).toContain('{invalidplaceholder}');
    });

    it('should handle mixed valid and invalid placeholders', () => {
      const message = 'Hello {followername}! Your {invalid} is great!';
      const validation = messageProcessor.validatePlaceholders(message);
      
      expect(validation.valid).toBe(false);
      expect(validation.foundPlaceholders).toContain('{followername}');
      expect(validation.foundPlaceholders).toContain('{invalid}');
      expect(validation.invalidPlaceholders).toContain('{invalid}');
      expect(validation.validPlaceholders).toContain('{followername}');
    });

    it('should handle duplicate placeholders', () => {
      const message = 'Hello {followername}! Bye {followername}!';
      const validation = messageProcessor.validatePlaceholders(message);
      
      expect(validation.valid).toBe(true);
      expect(validation.foundPlaceholders).toHaveLength(1);
      expect(validation.foundPlaceholders[0]).toBe('{followername}');
    });

    it('should handle message without placeholders', () => {
      const message = 'Hello world!';
      const validation = messageProcessor.validatePlaceholders(message);
      
      expect(validation.valid).toBe(true);
      expect(validation.foundPlaceholders).toHaveLength(0);
      expect(validation.invalidPlaceholders).toHaveLength(0);
    });

    it('should handle malformed placeholders', () => {
      const message = 'Hello {incomplete and {empty}!';
      const validation = messageProcessor.validatePlaceholders(message);
      
      expect(validation.foundPlaceholders).toContain('{empty}');
      expect(validation.invalidPlaceholders).toContain('{empty}');
    });
  });

  describe('previewMessage', () => {
    it('should generate preview with sample data', () => {
      const message = 'Hello {followername}! Thanks for {keyword}!';
      const preview = messageProcessor.previewMessage(message);
      
      expect(preview).toBe('Hello john_doe! Thanks for hello!');
    });

    it('should handle message without placeholders', () => {
      const message = 'Hello world!';
      const preview = messageProcessor.previewMessage(message);
      
      expect(preview).toBe('Hello world!');
    });

    it('should handle empty message', () => {
      const preview = messageProcessor.previewMessage('');
      expect(preview).toBe('');
    });

    it('should include time and date in preview', () => {
      const message = 'Time: {time}, Date: {date}';
      const preview = messageProcessor.previewMessage(message);
      
      expect(preview).toContain('Time:');
      expect(preview).toContain('Date:');
      expect(preview).not.toContain('{time}');
      expect(preview).not.toContain('{date}');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'Hello {followername}! '.repeat(1000);
      const context = { username: 'test' };
      
      const result = messageProcessor.processMessage(longMessage, context);
      expect(result).toContain('Hello test!');
      expect(result.length).toBeGreaterThan(1000);
    });

    it('should handle special characters in context', () => {
      const message = 'Hello {followername}!';
      const context = { username: 'user@#$%^&*()' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hello user@#$%^&*()!');
    });

    it('should handle unicode characters', () => {
      const message = 'Hello {followername}! 🎉';
      const context = { username: 'user_🌟' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hello user_🌟! 🎉');
    });

    it('should handle nested braces', () => {
      const message = 'Hello {{followername}}!';
      const context = { username: 'test' };
      
      const result = messageProcessor.processMessage(message, context);
      expect(result).toBe('Hello {test}!');
    });
  });
});