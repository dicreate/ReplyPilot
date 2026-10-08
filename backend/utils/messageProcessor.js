const logger = require('./logger');

class MessageProcessor {
  constructor() {
    // Define available placeholder variables
    this.placeholders = {
      '{followername}': 'The username of the person who commented',
      '{username}': 'The username of the person who commented (alias for followername)',
      '{keyword}': 'The keyword that was matched',
      '{time}': 'Current time',
      '{date}': 'Current date'
    };
  }

  /**
   * Replace placeholder variables in a message
   * @param {string} message - The message template with placeholders
   * @param {object} context - Context object containing replacement values
   * @returns {string} - Processed message with placeholders replaced
   */
  processMessage(message, context = {}) {
    try {
      let processedMessage = message;

      // Replace followername/username
      if (context.username) {
        processedMessage = processedMessage.replace(/{followername}/gi, context.username);
        processedMessage = processedMessage.replace(/{username}/gi, context.username);
      }

      // Replace keyword
      if (context.keyword) {
        processedMessage = processedMessage.replace(/{keyword}/gi, context.keyword);
      }

      // Replace time and date
      const now = new Date();
      processedMessage = processedMessage.replace(/{time}/gi, now.toLocaleTimeString());
      processedMessage = processedMessage.replace(/{date}/gi, now.toLocaleDateString());

      return processedMessage;
    } catch (err) {
      logger.error(`Error processing message: ${err.message}`);
      return message; // Return original message if processing fails
    }
  }

  /**
   * Get list of available placeholders
   * @returns {object} - Object containing placeholder descriptions
   */
  getAvailablePlaceholders() {
    return this.placeholders;
  }

  /**
   * Validate if a message contains valid placeholders
   * @param {string} message - The message to validate
   * @returns {object} - Validation result with valid/invalid placeholders
   */
  validatePlaceholders(message) {
    // [^{}]+ — берём innermost-плейсхолдер, чтобы вложенные скобки
    // ('{incomplete and {empty}') давали '{empty}', а не весь кусок.
    const placeholderRegex = /{([^{}]+)}/g;
    const foundPlaceholders = [];
    const invalidPlaceholders = [];
    let match;

    while ((match = placeholderRegex.exec(message)) !== null) {
      const placeholder = `{${match[1]}}`;
      foundPlaceholders.push(placeholder);

      if (!this.placeholders[placeholder.toLowerCase()]) {
        invalidPlaceholders.push(placeholder);
      }
    }

    return {
      valid: invalidPlaceholders.length === 0,
      foundPlaceholders: [...new Set(foundPlaceholders)], // Remove duplicates
      invalidPlaceholders: [...new Set(invalidPlaceholders)],
      validPlaceholders: foundPlaceholders.filter(p => 
        this.placeholders[p.toLowerCase()]
      )
    };
  }

  /**
   * Preview a message with sample data
   * @param {string} message - The message template
   * @returns {string} - Preview of the processed message
   */
  previewMessage(message) {
    const sampleContext = {
      username: 'john_doe',
      keyword: 'hello'
    };

    return this.processMessage(message, sampleContext);
  }
}

module.exports = new MessageProcessor();