// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('instagram_dm_automation');

// Create application user with read/write permissions
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'instagram_dm_automation'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['instagramId', 'accessToken'],
      properties: {
        instagramId: {
          bsonType: 'string',
          description: 'Instagram user ID - required'
        },
        accessToken: {
          bsonType: 'string',
          description: 'Instagram access token - required'
        },
        username: {
          bsonType: 'string',
          description: 'Instagram username'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
          description: 'Valid email address'
        },
        isActive: {
          bsonType: 'bool',
          description: 'User active status'
        }
      }
    }
  }
});

db.createCollection('keywords', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'keyword', 'message'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID reference - required'
        },
        keyword: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Keyword to match - required'
        },
        message: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 1000,
          description: 'Response message - required'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Keyword active status'
        },
        matchCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of times keyword was matched'
        }
      }
    }
  }
});

db.createCollection('analytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'date'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID reference - required'
        },
        date: {
          bsonType: 'date',
          description: 'Analytics date - required'
        },
        dmsSent: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of DMs sent'
        },
        commentsProcessed: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of comments processed'
        },
        keywordMatches: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of keyword matches'
        },
        errors: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of errors'
        }
      }
    }
  }
});

db.createCollection('processedcomments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'commentId', 'mediaId', 'commentText', 'commentAuthor'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'User ID reference - required'
        },
        commentId: {
          bsonType: 'string',
          description: 'Instagram comment ID - required'
        },
        mediaId: {
          bsonType: 'string',
          description: 'Instagram media ID - required'
        },
        commentText: {
          bsonType: 'string',
          description: 'Comment text - required'
        },
        commentAuthor: {
          bsonType: 'string',
          description: 'Comment author username - required'
        },
        dmSent: {
          bsonType: 'bool',
          description: 'Whether DM was sent'
        }
      }
    }
  }
});

print('Database initialization completed successfully!');