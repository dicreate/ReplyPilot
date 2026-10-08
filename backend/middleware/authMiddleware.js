const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the request header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // Attach the user to the request object
    req.user = decoded;
    req.userDoc = user; // Also attach the full user document for convenience
    
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn(`Token expired for request to ${req.path}`);
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    } else if (err.name === 'JsonWebTokenError') {
      logger.warn(`Invalid token for request to ${req.path}`);
      return res.status(401).json({ message: "Invalid token" });
    } else {
      logger.error(`Auth middleware error: ${err.message}`);
      return res.status(500).json({ message: "Authentication error" });
    }
  }
};

module.exports = authMiddleware;