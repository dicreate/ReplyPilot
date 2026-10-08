#!/usr/bin/env node

/**
 * Script to test Facebook Graph API token
 * Tests what permissions and data the token can access
 */

const axios = require('axios');

const ACCESS_TOKEN = 'EAAtGmu4467ABPD70lLxRHqZCaxdbMQlYHDhXHqntRH1hJCo1SySG9poD2oYQw40b0lHfsV0M08I5OBW7CZCHDhHNVecS8AtC470npBbhZAhSKcgZCnzbeECF4pwToWT0FZAyHinDLKvb8b3C2YLLZCjZAKStwQzgAGjxgtCuIJv2zI2JlTaEOJNtEZCZCbvWERKAe';

console.log('🔍 Testing Facebook Graph API Token\n');

async function testEndpoint(url, description) {
  try {
    console.log(`Testing ${description}...`);
    const response = await axios.get(url);
    
    console.log(`✅ ${description} - Success`);
    console.log(`📊 Data:`, JSON.stringify(response.data, null, 2));
    console.log('');
    return response.data;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.response?.data?.error?.message || error.message}`);
    console.log('');
    return null;
  }
}

async function runTests() {
  console.log(`🔑 Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  console.log('');
  
  // Test 1: Get user info
  await testEndpoint(
    `https://graph.facebook.com/me?access_token=${ACCESS_TOKEN}`,
    'User Profile'
  );
  
  // Test 2: Get token permissions
  await testEndpoint(
    `https://graph.facebook.com/me/permissions?access_token=${ACCESS_TOKEN}`,
    'Token Permissions'
  );
  
  // Test 3: Get user's pages
  await testEndpoint(
    `https://graph.facebook.com/me/accounts?access_token=${ACCESS_TOKEN}`,
    'User Pages'
  );
  
  // Test 4: Check token info
  await testEndpoint(
    `https://graph.facebook.com/oauth/access_token_info?access_token=${ACCESS_TOKEN}`,
    'Token Info'
  );
  
  // Test 5: Get Instagram Business Accounts (if any)
  const pages = await testEndpoint(
    `https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`,
    'Instagram Business Accounts'
  );
  
  if (pages && pages.data) {
    for (const page of pages.data) {
      if (page.instagram_business_account) {
        console.log(`🎯 Found Instagram Business Account: ${page.instagram_business_account.id}`);
        
        // Test Instagram account details
        await testEndpoint(
          `https://graph.facebook.com/${page.instagram_business_account.id}?fields=id,username,account_type,media_count&access_token=${ACCESS_TOKEN}`,
          `Instagram Account Details (${page.instagram_business_account.id})`
        );
      }
    }
  }
  
  console.log('🎉 Token testing complete!');
}

// Check if axios is available
try {
  runTests();
} catch (error) {
  console.log('❌ Error: axios module not found. Please run this from the backend directory:');
  console.log('   cd backend && node ../scripts/test-facebook-token.js');
}