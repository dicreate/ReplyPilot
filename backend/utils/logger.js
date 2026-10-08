const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    // Log to console
    console.log(logMessage.trim());
    
    // Log to file
    const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage);
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  warn(message) {
    this.log(message, 'WARN');
  }

  info(message) {
    this.log(message, 'INFO');
  }
}

module.exports = new Logger();