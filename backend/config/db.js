const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  // В тестах соединением владеет tests/setup.js (in-memory Mongo).
  // Прямой вызов connectDB() из тестов с боевой строкой ронял сьют
  // openUri-конфликтом и писал в прод-БД — поэтому здесь no-op.
  if (process.env.NODE_ENV === 'test') {
    return mongoose.connection;
  }
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const isAtlas = process.env.MONGO_URI.includes('mongodb+srv');

    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      // Atlas M0 free tier can cold-start, give it more time than local
      serverSelectionTimeoutMS: isAtlas ? 10000 : 5000,
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Add authentication if credentials are provided separately
    // (not needed when credentials are already in MONGO_URI, e.g. Atlas)
    if (process.env.MONGO_USERNAME && process.env.MONGO_PASSWORD) {
      options.auth = {
        username: process.env.MONGO_USERNAME,
        password: process.env.MONGO_PASSWORD
      };
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    // Log without credentials: host + db name only
    logger.info(
      `MongoDB connected (${isAtlas ? 'Atlas' : 'local'}): ${conn.connection.host}/${conn.connection.name}`
    );

    // Create database indexes for optimal performance
    if (process.env.NODE_ENV !== 'test') {
      const { createIndexes } = require('./indexes');
      await createIndexes();
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error(`Error closing MongoDB connection: ${err}`);
        process.exit(1);
      }
    });

  } catch (err) {
    logger.error(`MongoDB connection error: ${err}`);
    process.exit(1);
  }
};

module.exports = connectDB;