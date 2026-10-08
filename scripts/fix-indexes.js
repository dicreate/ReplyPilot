#!/usr/bin/env node

/**
 * Script to fix MongoDB index conflicts
 * Run this from the backend directory: cd backend && node ../scripts/fix-indexes.js
 */

const path = require('path');
const fs = require('fs');

// Check if we're in the right directory
const backendPath = process.cwd().includes('backend') ? '.' : './backend';
const envPath = path.join(backendPath, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Please run this script from the backend directory:');
  console.error('   cd backend && node ../scripts/fix-indexes.js');
  process.exit(1);
}

require('dotenv').config({ path: envPath });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/instagram_auto_reply';

async function fixIndexes() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    const db = mongoose.connection.db;
    
    console.log('📋 Listing existing indexes...');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`\n📁 Collection: ${collectionName}`);
      
      try {
        const indexes = await collection.indexes();
        console.log(`   Found ${indexes.length} indexes:`);
        
        for (const index of indexes) {
          console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
          
          // Drop problematic duplicate indexes
          if (index.name.includes('userId_1_keyword_1_isActive_1') && 
              index.name !== 'userId_1_keyword_1_isActive_1') {
            console.log(`   ❌ Dropping duplicate index: ${index.name}`);
            await collection.dropIndex(index.name);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Could not list indexes for ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Index cleanup complete!');
    console.log('💡 You can now restart your application.');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
fixIndexes();