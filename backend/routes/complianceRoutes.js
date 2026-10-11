const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Keyword = require('../models/Keyword');
const ProcessedComment = require('../models/ProcessedComment');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');

/**
 * Data Deletion Request Endpoint
 * Required by Facebook for Instagram Basic Display API compliance
 * This endpoint handles user data deletion requests from Facebook
 */
router.post('/data-deletion', async (req, res) => {
  try {
    const { signed_request } = req.body;
    
    if (!signed_request) {
      return res.status(400).json({ 
        error: 'Missing signed_request parameter' 
      });
    }

    // Parse the signed request (simplified version)
    // In production, you should verify the signature using your app secret
    const [encodedSig, payload] = signed_request.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    const userId = data.user_id;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Invalid signed_request: missing user_id' 
      });
    }

    logger.info(`Data deletion request received for Instagram user: ${userId}`);

    // Find user by Instagram ID
    const user = await User.findOne({ instagramId: userId });
    
    if (user) {
      // Delete all user data
      await Promise.all([
        // Delete user's keywords
        Keyword.deleteMany({ userId: user._id }),
        // Delete user's processed comments
        ProcessedComment.deleteMany({ userId: user._id }),
        // Delete user's analytics
        Analytics.deleteMany({ userId: user._id }),
        // Delete the user account
        User.deleteOne({ _id: user._id })
      ]);

      logger.info(`Successfully deleted all data for user: ${userId}`);
    } else {
      logger.info(`No data found for user: ${userId}`);
    }

    // Return confirmation URL as required by Facebook
    const confirmationCode = `del_${userId}_${Date.now()}`;
    
    res.status(200).json({
      url: `${req.protocol}://${req.get('host')}/api/compliance/deletion-status/${confirmationCode}`,
      confirmation_code: confirmationCode
    });

  } catch (error) {
    logger.error(`Data deletion request error: ${error.message}`);
    res.status(500).json({ 
      error: 'Internal server error processing deletion request' 
    });
  }
});

/**
 * Data Deletion Status Endpoint
 * Provides status of data deletion requests
 */
router.get('/deletion-status/:confirmationCode', (req, res) => {
  const { confirmationCode } = req.params;
  
  res.status(200).json({
    status: 'completed',
    message: 'User data has been successfully deleted',
    confirmation_code: confirmationCode,
    timestamp: new Date().toISOString()
  });
});

/**
 * Deauthorization Callback Endpoint
 * Called when a user removes the app from their Instagram account
 */
router.post('/deauthorize', async (req, res) => {
  try {
    const { signed_request } = req.body;
    
    if (!signed_request) {
      return res.status(400).json({ 
        error: 'Missing signed_request parameter' 
      });
    }

    // Parse the signed request
    const [encodedSig, payload] = signed_request.split('.');
    const data = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    const userId = data.user_id;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Invalid signed_request: missing user_id' 
      });
    }

    logger.info(`Deauthorization request received for Instagram user: ${userId}`);

    // Find and deactivate user
    const user = await User.findOne({ instagramId: userId });
    
    if (user) {
      // Mark user as inactive and clear access token
      user.isActive = false;
      user.accessToken = null;
      user.deauthorizedAt = new Date();
      await user.save();

      logger.info(`User deauthorized: ${userId}`);
    }

    res.status(200).json({ 
      success: true,
      message: 'Deauthorization processed successfully' 
    });

  } catch (error) {
    logger.error(`Deauthorization error: ${error.message}`);
    res.status(500).json({ 
      error: 'Internal server error processing deauthorization' 
    });
  }
});

/**
 * Privacy Policy Endpoint
 * Required for Facebook app compliance
 */
router.get('/privacy-policy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Privacy Policy - ReplyPilot</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2 { color: #333; }
            p { line-height: 1.6; }
        </style>
    </head>
    <body>
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Information We Collect</h2>
        <p>We collect the following information when you use our ReplyPilot service:</p>
        <ul>
            <li>Instagram user ID and username</li>
            <li>Access tokens for Instagram API access</li>
            <li>Comments and media data you choose to process</li>
            <li>Keywords and automated responses you configure</li>
        </ul>
        
        <h2>How We Use Your Information</h2>
        <p>We use your information solely to provide the Instagram DM automation service, including:</p>
        <ul>
            <li>Processing comments on your Instagram posts</li>
            <li>Sending automated direct messages based on your keywords</li>
            <li>Providing analytics about your automation activity</li>
        </ul>
        
        <h2>Data Storage and Security</h2>
        <p>Your data is stored securely and is only accessible by you through your account. We implement appropriate security measures to protect your information.</p>
        
        <h2>Data Deletion</h2>
        <p>You can request deletion of your data at any time by removing our app from your Instagram account or contacting us directly.</p>
        
        <h2>Contact Us</h2>
        <p>If you have questions about this privacy policy, please contact us at: privacy@yourapp.com</p>
    </body>
    </html>
  `);
});

/**
 * Terms of Service Endpoint
 * Required for Facebook app compliance
 */
router.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Terms of Service - ReplyPilot</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2 { color: #333; }
            p { line-height: 1.6; }
        </style>
    </head>
    <body>
        <h1>Terms of Service</h1>
        <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Acceptance of Terms</h2>
        <p>By using our ReplyPilot service, you agree to these terms of service.</p>
        
        <h2>Service Description</h2>
        <p>Our service provides automated direct messaging capabilities for Instagram accounts based on comment keywords.</p>
        
        <h2>User Responsibilities</h2>
        <ul>
            <li>You must comply with Instagram's Terms of Service and Community Guidelines</li>
            <li>You are responsible for the content of automated messages sent through our service</li>
            <li>You must not use our service for spam or harassment</li>
        </ul>
        
        <h2>Limitations</h2>
        <p>Our service is provided "as is" without warranties. We are not responsible for any issues arising from Instagram API changes or limitations.</p>
        
        <h2>Termination</h2>
        <p>We reserve the right to terminate service for violations of these terms or Instagram's policies.</p>
        
        <h2>Contact Us</h2>
        <p>If you have questions about these terms, please contact us at: support@yourapp.com</p>
    </body>
    </html>
  `);
});

module.exports = router;