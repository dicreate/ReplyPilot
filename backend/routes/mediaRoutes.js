const express = require("express");
const mediaController = require("../controllers/mediaController");
const authMiddleware = require("../middleware/authMiddleware");
const tokenRefreshMiddleware = require("../middleware/tokenRefreshMiddleware");
const { validateMediaId, sanitizeInput } = require("../middleware/validationMiddleware");

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Process comments for a specific media
router.post("/process/:mediaId", 
  authMiddleware, 
  tokenRefreshMiddleware,
  validateMediaId, 
  mediaController.processMediaComments
);

// Get processing history
router.get("/history", 
  authMiddleware, 
  mediaController.getProcessingHistory
);

// Get recent media posts
router.get("/recent", 
  authMiddleware, 
  tokenRefreshMiddleware,
  mediaController.getRecentMedia
);

module.exports = router;