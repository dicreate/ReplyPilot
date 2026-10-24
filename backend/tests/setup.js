const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup test database
// MongoMemoryServer может загружаться долго (>30s) на Windows — даем 120s
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}, 120000);

// Clean up after each test
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (e) {}
}, 30000);

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (e) {}
  try {
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (e) {}
}, 60000);

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.INSTAGRAM_CLIENT_ID = 'test-client-id';
process.env.INSTAGRAM_CLIENT_SECRET = 'test-client-secret';
process.env.INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
