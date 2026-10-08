const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  facebookId: { type: String, required: true, unique: true },
  instagramId: { type: String }, // Primary Instagram account
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
  username: { type: String },
  email: { type: String, unique: true, sparse: true },
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  deauthorizedAt: { type: Date },
  instagramAccounts: [{ // Support multiple Instagram business accounts
    pageId: String,
    instagramId: String,
    pageAccessToken: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("User", UserSchema);