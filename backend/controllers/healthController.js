const mongoose = require('mongoose');
const cacheService = require('../services/cacheService');
const instagramService = require('../services/instagramService');
const logger = require('../utils/logger');
const { sendHealthAlert } = require('../utils/notifier');

// Basic health check
exports.healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message
      }
    });
  }
};

// Detailed health check with dependencies
exports.detailedHealthCheck = async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  let overallStatus = 'healthy';

  try {
    // Database health check
    try {
      const dbState = mongoose.connection.readyState;
      const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
      
      if (dbState === 1) {
        // Test database operation
        await mongoose.connection.db.admin().ping();
        health.checks.database = {
          status: 'healthy',
          state: dbStatus,
          responseTime: Date.now() - startTime
        };
      } else {
        health.checks.database = {
          status: 'unhealthy',
          state: dbStatus,
          error: 'Database not connected'
        };
        overallStatus = 'unhealthy';
      }
    } catch (dbError) {
      health.checks.database = {
        status: 'unhealthy',
        error: dbError.message
      };
      overallStatus = 'unhealthy';
    }

    // Cache health check
    try {
      const cacheStats = cacheService.getStats();
      health.checks.cache = {
        status: 'healthy',
        stats: cacheStats
      };
    } catch (cacheError) {
      health.checks.cache = {
        status: 'unhealthy',
        error: cacheError.message
      };
      overallStatus = 'degraded';
    }

    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Check if memory usage is too high (over 500MB)
    const memoryStatus = memUsageMB.heapUsed > 500 ? 'warning' : 'healthy';
    if (memoryStatus === 'warning' && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }

    health.checks.memory = {
      status: memoryStatus,
      usage: memUsageMB
    };

    // CPU usage check (simplified)
    const cpuUsage = process.cpuUsage();
    health.checks.cpu = {
      status: 'healthy',
      usage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };

    // Instagram API connectivity check (optional, only if we have a test token)
    if (process.env.INSTAGRAM_TEST_TOKEN) {
      try {
        const apiCheck = await instagramService.validateAccessToken(process.env.INSTAGRAM_TEST_TOKEN);
        health.checks.instagramApi = {
          status: apiCheck ? 'healthy' : 'unhealthy',
          message: apiCheck ? 'API accessible' : 'API not accessible'
        };
        
        if (!apiCheck && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (apiError) {
        health.checks.instagramApi = {
          status: 'unhealthy',
          error: apiError.message
        };
        if (overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      }
    }

    health.status = overallStatus;
    health.responseTime = Date.now() - startTime;

    // Send alert if system is unhealthy
    if (overallStatus === 'unhealthy') {
      await sendHealthAlert(health).catch(err => {
        logger.error(`Failed to send health alert: ${err.message}`);
      });
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: health
    });

  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      }
    });
  }
};

// Readiness check (for Kubernetes/Docker)
exports.readinessCheck = async (req, res) => {
  try {
    // Check if database is ready
    const dbReady = mongoose.connection.readyState === 1;
    
    if (!dbReady) {
      return res.status(503).json({
        success: false,
        message: 'Service not ready - database not connected'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service is ready'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service not ready',
      error: error.message
    });
  }
};

// Liveness check (for Kubernetes/Docker)
exports.livenessCheck = async (req, res) => {
  try {
    // Simple check to see if the process is alive
    res.status(200).json({
      success: true,
      message: 'Service is alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service is not alive',
      error: error.message
    });
  }
};

// System metrics
exports.getMetrics = async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      cache: cacheService.getStats(),
      database: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error(`Metrics error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};