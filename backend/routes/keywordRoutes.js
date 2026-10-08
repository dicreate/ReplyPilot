const express = require("express");
const keywordController = require("../controllers/keywordController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateKeyword, sanitizeInput } = require("../middleware/validationMiddleware");

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Get all keywords for the authenticated user
router.get("/", authMiddleware, keywordController.getKeywords);

// Get available placeholders
router.get("/placeholders", authMiddleware, keywordController.getPlaceholders);

// Preview a message
router.post("/preview", authMiddleware, keywordController.previewMessage);

// Add a new keyword
router.post("/", authMiddleware, validateKeyword, keywordController.addKeyword);

// Update an existing keyword
router.put("/:id", authMiddleware, validateKeyword, keywordController.updateKeyword);

// Delete a keyword
router.delete("/:id", authMiddleware, keywordController.deleteKeyword);

module.exports = router;