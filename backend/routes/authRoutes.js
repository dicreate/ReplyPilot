const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const tokenRefreshMiddleware = require("../middleware/tokenRefreshMiddleware");

const router = express.Router();

// Instagram OAuth login
router.post("/instagram", authController.instagramLogin);

// Get current user info
router.get("/user", authMiddleware, tokenRefreshMiddleware, authController.getCurrentUser);

// Refresh access token
router.post("/refresh", authMiddleware, authController.refreshToken);

module.exports = router;