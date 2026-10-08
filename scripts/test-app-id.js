#!/usr/bin/env node

/**
 * Simple test to verify Facebook App ID
 */

const APP_ID = '1301764848321627';
const APP_SECRET = '24bee85886c45d9dbcacdfb7c300d076';

console.log('🔍 Testing Facebook App ID\n');

console.log(`App ID: ${APP_ID}`);
console.log(`App Secret: ${APP_SECRET.substring(0, 10)}...`);
console.log('');

// Test URLs
console.log('🧪 Test these URLs in your browser:\n');

console.log('1. Facebook OAuth URL:');
console.log(`https://www.facebook.com/v18.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=https://xr9mbjzk-5173.inc1.devtunnels.ms/auth/instagram/callback&scope=pages_show_list&response_type=code`);
console.log('');

console.log('2. App Access Token URL:');
console.log(`https://graph.facebook.com/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`);
console.log('');

console.log('3. App Info URL (use app access token from above):');
console.log(`https://graph.facebook.com/${APP_ID}?access_token=APP_ACCESS_TOKEN_HERE`);
console.log('');

console.log('💡 If any of these URLs show "Invalid app ID", then the App ID is wrong.');
console.log('   Go to https://developers.facebook.com/apps/ and get the correct App ID.');