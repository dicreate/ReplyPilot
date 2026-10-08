const nodemailer = require('nodemailer');
const logger = require('./logger');

class Notifier {
  constructor() {
    this.transporter = null;
    // Методы дёргают деструктурированными (const { sendErrorEmail } = require(...)),
    // без bind теряется this и падает TypeError на первом же error-path.
    this.sendErrorEmail = this.sendErrorEmail.bind(this);
    this.sendInfoEmail = this.sendInfoEmail.bind(this);
    this.setupTransporter();
    this.emailThrottle = new Map(); // For throttling notifications
    this.throttleWindow = 60 * 60 * 1000; // 1 hour
    this.maxEmailsPerHour = 10;
  }

  setupTransporter() {
    // Only setup if email credentials are provided
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  // Check if we should throttle notifications
  shouldThrottleEmail(type, identifier = 'default') {
    const key = `${type}_${identifier}`;
    const now = Date.now();
    
    if (!this.emailThrottle.has(key)) {
      this.emailThrottle.set(key, []);
    }
    
    const timestamps = this.emailThrottle.get(key);
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.throttleWindow);
    this.emailThrottle.set(key, validTimestamps);
    
    // Check if we've exceeded the limit
    if (validTimestamps.length >= this.maxEmailsPerHour) {
      return true;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    return false;
  }

  // Classify error severity
  classifyErrorSeverity(error, context = {}) {
    const message = error.message || error;
    const statusCode = context.statusCode || error.statusCode;
    
    // Critical errors
    if (statusCode >= 500 || 
        message.includes('database') || 
        message.includes('connection') ||
        message.includes('ECONNREFUSED')) {
      return 'critical';
    }
    
    // High priority errors
    if (statusCode === 401 || 
        statusCode === 403 ||
        message.includes('authentication') ||
        message.includes('authorization')) {
      return 'high';
    }
    
    // Medium priority errors
    if (statusCode >= 400 || 
        message.includes('validation') ||
        message.includes('rate limit')) {
      return 'medium';
    }
    
    return 'low';
  }

  async sendErrorEmail(errorMessage, context = {}) {
    if (!this.transporter || !process.env.ADMIN_EMAIL) {
      logger.warn('Email notification not configured, logging error instead');
      logger.error(`Error notification: ${errorMessage}`, context);
      return;
    }

    const severity = this.classifyErrorSeverity({ message: errorMessage }, context);
    
    // Only send emails for medium and above severity, or if explicitly requested
    if (severity === 'low' && !context.forceEmail) {
      logger.info(`Low severity error not emailed: ${errorMessage}`);
      return;
    }

    // Check throttling
    if (this.shouldThrottleEmail('error', severity)) {
      logger.warn(`Error email throttled for severity ${severity}: ${errorMessage}`);
      return;
    }

    try {
      const severityColors = {
        critical: '#dc3545',
        high: '#fd7e14',
        medium: '#ffc107',
        low: '#6c757d'
      };

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Instagram DM Automation - ${severity.toUpperCase()} Error Alert`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${severityColors[severity]}; color: white; padding: 20px; text-align: center;">
              <h2>🚨 ${severity.toUpperCase()} Error Alert</h2>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h3>Error Details</h3>
              <p><strong>Message:</strong> ${errorMessage}</p>
              <p><strong>Severity:</strong> ${severity}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              
              ${context.method ? `<p><strong>Method:</strong> ${context.method}</p>` : ''}
              ${context.url ? `<p><strong>URL:</strong> ${context.url}</p>` : ''}
              ${context.userId ? `<p><strong>User ID:</strong> ${context.userId}</p>` : ''}
              ${context.ip ? `<p><strong>IP:</strong> ${context.ip}</p>` : ''}
              
              <h4>Context</h4>
              <pre style="background-color: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(context, null, 2)}</pre>
            </div>
            <div style="padding: 20px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
              Instagram DM Automation System
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`${severity} error notification email sent successfully`);
    } catch (err) {
      logger.error(`Failed to send error notification email: ${err.message}`);
    }
  }

  async sendInfoEmail(subject, message, options = {}) {
    if (!this.transporter || !process.env.ADMIN_EMAIL) {
      logger.info(`Info notification: ${subject} - ${message}`);
      return;
    }

    // Check throttling for info emails
    if (this.shouldThrottleEmail('info', subject)) {
      logger.warn(`Info email throttled for subject: ${subject}`);
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Instagram DM Automation - ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
              <h2>ℹ️ ${subject}</h2>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <div style="font-size: 16px; line-height: 1.6;">
                ${message}
              </div>
              <p style="margin-top: 20px;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              ${options.context ? `
                <h4>Additional Information</h4>
                <pre style="background-color: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(options.context, null, 2)}</pre>
              ` : ''}
            </div>
            <div style="padding: 20px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
              Instagram DM Automation System
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Info notification email sent successfully');
    } catch (err) {
      logger.error(`Failed to send info notification email: ${err.message}`);
    }
  }

  // Send daily summary email
  async sendDailySummary(summaryData) {
    if (!this.transporter || !process.env.ADMIN_EMAIL) {
      logger.info('Daily summary email not configured');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'Instagram DM Automation - Daily Summary',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
              <h2>📊 Daily Summary Report</h2>
              <p>${new Date().toLocaleDateString()}</p>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                  <h3 style="margin: 0; font-size: 24px;">${summaryData.totalDmsSent || 0}</h3>
                  <p style="margin: 5px 0 0 0;">DMs Sent</p>
                </div>
                <div style="background-color: #17a2b8; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                  <h3 style="margin: 0; font-size: 24px;">${summaryData.totalCommentsProcessed || 0}</h3>
                  <p style="margin: 5px 0 0 0;">Comments Processed</p>
                </div>
                <div style="background-color: #ffc107; color: black; padding: 15px; border-radius: 8px; text-align: center;">
                  <h3 style="margin: 0; font-size: 24px;">${summaryData.totalKeywordMatches || 0}</h3>
                  <p style="margin: 5px 0 0 0;">Keyword Matches</p>
                </div>
                <div style="background-color: ${summaryData.totalErrors > 0 ? '#dc3545' : '#28a745'}; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                  <h3 style="margin: 0; font-size: 24px;">${summaryData.totalErrors || 0}</h3>
                  <p style="margin: 5px 0 0 0;">Errors</p>
                </div>
              </div>
              
              ${summaryData.topKeywords && summaryData.topKeywords.length > 0 ? `
                <h4>Top Performing Keywords</h4>
                <ul>
                  ${summaryData.topKeywords.map(kw => `<li><strong>${kw.keyword}</strong>: ${kw.matches} matches</li>`).join('')}
                </ul>
              ` : ''}
              
              ${summaryData.activeUsers ? `
                <p><strong>Active Users:</strong> ${summaryData.activeUsers}</p>
              ` : ''}
            </div>
            <div style="padding: 20px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
              Instagram DM Automation System - Daily Report
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Daily summary email sent successfully');
    } catch (err) {
      logger.error(`Failed to send daily summary email: ${err.message}`);
    }
  }

  // Send system health notification
  async sendHealthAlert(healthData) {
    if (!this.transporter || !process.env.ADMIN_EMAIL) {
      logger.warn('Health alert email not configured');
      return;
    }

    const isHealthy = healthData.status === 'healthy';
    const color = isHealthy ? '#28a745' : '#dc3545';
    const icon = isHealthy ? '✅' : '🚨';

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Instagram DM Automation - System Health ${isHealthy ? 'OK' : 'ALERT'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
              <h2>${icon} System Health ${isHealthy ? 'Check' : 'Alert'}</h2>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <p><strong>Status:</strong> ${healthData.status}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              
              ${healthData.details ? `
                <h4>Details</h4>
                <ul>
                  ${Object.entries(healthData.details).map(([key, value]) => 
                    `<li><strong>${key}:</strong> ${value}</li>`
                  ).join('')}
                </ul>
              ` : ''}
              
              ${healthData.metrics ? `
                <h4>System Metrics</h4>
                <pre style="background-color: #e9ecef; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(healthData.metrics, null, 2)}</pre>
              ` : ''}
            </div>
            <div style="padding: 20px; background-color: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
              Instagram DM Automation System
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Health alert email sent successfully (${healthData.status})`);
    } catch (err) {
      logger.error(`Failed to send health alert email: ${err.message}`);
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not configured' };
    }

    try {
      await this.transporter.verify();
      await this.sendInfoEmail('Test Email', 'This is a test email to verify the notification system is working correctly.');
      return { success: true, message: 'Email configuration test successful' };
    } catch (err) {
      logger.error(`Email configuration test failed: ${err.message}`);
      return { success: false, message: err.message };
    }
  }
}

module.exports = new Notifier();