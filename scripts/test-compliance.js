#!/usr/bin/env node

/**
 * Script to test Facebook compliance endpoints
 * Run this to verify your compliance URLs work correctly
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

console.log('🔍 Testing Facebook Compliance Endpoints\n');

async function testEndpoint(url, description) {
  try {
    console.log(`Testing ${description}...`);
    const response = await axios.get(url);
    
    if (response.status === 200) {
      console.log(`✅ ${description} - OK (${response.status})`);
      return true;
    } else {
      console.log(`⚠️  ${description} - Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log(`Base URL: ${BASE_URL}\n`);
  
  const tests = [
    [`${BASE_URL}/api/compliance/privacy-policy`, 'Privacy Policy'],
    [`${BASE_URL}/api/compliance/terms`, 'Terms of Service'],
    [`${BASE_URL}/health`, 'Health Check']
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [url, description] of tests) {
    const success = await testEndpoint(url, description);
    if (success) passed++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Results: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All compliance endpoints are working correctly!');
    console.log('\n📋 URLs to use in Facebook App Settings:');
    console.log(`   Privacy Policy: ${BASE_URL}/api/compliance/privacy-policy`);
    console.log(`   Terms of Service: ${BASE_URL}/api/compliance/terms`);
    console.log(`   Data Deletion: ${BASE_URL}/api/compliance/data-deletion`);
    console.log(`   Deauthorize: ${BASE_URL}/api/compliance/deauthorize`);
  } else {
    console.log('❌ Some endpoints are not working. Make sure your backend server is running.');
  }
}

// Check if axios is available
try {
  runTests();
} catch (error) {
  console.log('❌ Error: axios module not found. Please run this from the backend directory:');
  console.log('   cd backend && node ../scripts/test-compliance.js');
}