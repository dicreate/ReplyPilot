#!/usr/bin/env node

/**
 * Debug script to check Facebook app configuration
 */

const axios = require('axios');

const APP_ID = '3173855979432880';
const APP_SECRET = '24bee85886c45d9dbcacdfb7c300d076';

console.log('🔍 Debugging Facebook App Configuration\n');

async function debugApp() {
  try {
    // Get app access token
    console.log('1. Getting app access token...');
    const tokenResponse = await axios.get(`https://graph.facebook.com/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`);
    const appToken = tokenResponse.data.access_token;
    console.log(`✅ App token: ${appToken.substring(0, 20)}...`);
    
    // Get app info
    console.log('\n2. Getting app information...');
    const appResponse = await axios.get(`https://graph.facebook.com/${APP_ID}?fields=id,name,category,app_domains,privacy_policy_url,terms_of_service_url&access_token=${appToken}`);
    console.log('✅ App Info:', JSON.stringify(appResponse.data, null, 2));
    
    // Check app roles
    console.log('\n3. Checking app roles...');
    const rolesResponse = await axios.get(`https://graph.facebook.com/${APP_ID}/roles?access_token=${appToken}`);
    console.log('✅ App Roles:', JSON.stringify(rolesResponse.data, null, 2));
    
    // Test Instagram Basic Display permissions
    console.log('\n4. Testing Instagram Basic Display...');
    try {
      const igResponse = await axios.get(`https://api.instagram.com/oauth/authorize?client_id=${APP_ID}&redirect_uri=https://xr9mbjzk-5173.inc1.devtunnels.ms/auth/instagram/callback&scope=user_profile,user_media&response_type=code`);
      console.log('✅ Instagram Basic Display URL is valid');
    } catch (error) {
      console.log('❌ Instagram Basic Display error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

debugApp();