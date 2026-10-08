#!/usr/bin/env node

/**
 * Script to test Instagram API configuration
 * Run this to validate your Instagram app setup
 */

const path = require('path');
const fs = require('fs');

// Check if we're in the right directory and find .env file
const possibleEnvPaths = [
  '../backend/.env',
  './backend/.env',
  './.env'
];

let envPath = null;
for (const testPath of possibleEnvPaths) {
  if (fs.existsSync(testPath)) {
    envPath = testPath;
    break;
  }
}

if (!envPath) {
  console.error('❌ Could not find .env file. Please run from project root or scripts directory.');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

console.log('🔍 Instagram API Configuration Test\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   CLIENT_ID: ${CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   CLIENT_SECRET: ${CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   REDIRECT_URI: ${REDIRECT_URI ? '✅ Set' : '❌ Missing'}`);

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please check your backend/.env file and update with your actual Instagram app credentials.');
  process.exit(1);
}

// Check if credentials look like example values
const isExampleCredentials = 
  CLIENT_ID === 'your_instagram_client_id' ||
  CLIENT_ID === 'your_actual_instagram_client_id_here' ||
  CLIENT_SECRET === 'your_instagram_client_secret' ||
  CLIENT_SECRET === 'your_actual_instagram_client_secret_here';

if (isExampleCredentials) {
  console.log('\n⚠️  You are using example credentials!');
  console.log('Please replace them with your actual Instagram app credentials from Facebook Developers.');
  console.log('See INSTAGRAM_SETUP.md for detailed instructions.');
  process.exit(1);
}

console.log('\n🔗 OAuth Authorization URL:');
const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
console.log(authUrl);

console.log('\n✅ Configuration looks good!');
console.log('\n📝 Next steps:');
console.log('1. Make sure your Instagram app has the Instagram Basic Display product added');
console.log('2. Add the redirect URI to your app settings in Facebook Developers');
console.log('3. Add test users to your app if testing in development mode');
console.log('4. Visit the authorization URL above to test the OAuth flow');

console.log('\n💡 If you get "Invalid platform app" error:');
console.log('- Verify your App ID and App Secret are correct');
console.log('- Ensure Instagram Basic Display product is added to your app');
console.log('- Check that redirect URI matches exactly in app settings');