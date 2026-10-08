const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// Basic health check
router.get('/', healthController.healthCheck);

// Detailed health check
router.get('/detailed', healthController.detailedHealthCheck);

// Kubernetes/Docker readiness probe
router.get('/ready', healthController.readinessCheck);

// Kubernetes/Docker liveness probe
router.get('/live', healthController.livenessCheck);

// System metrics
router.get('/metrics', healthController.getMetrics);

module.exports = router;