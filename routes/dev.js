const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { mockFirebaseAuth } = require("../middleware/auth.dev");

/**
 * Development and testing routes
 * Only available in development mode
 */

// Middleware to check development mode
const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      message: "Development routes not available in production",
    });
  }
  next();
};

/**
 * @route   POST /api/dev/create-user
 * @desc    Create a test user for development
 * @access  Development only
 */
router.post("/create-user", devOnly, async (req, res) => {
  try {
    const { username, email, firebaseUid } = req.body;

    const userData = {
      username: username || `testuser_${Date.now()}`,
      email: email || `test_${Date.now()}@dev.com`,
      firebaseUid: firebaseUid || `dev_uid_${Date.now()}`,
      profilePhoto: "https://via.placeholder.com/150",
    };

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: userData.username },
        { email: userData.email },
        { firebaseUid: userData.firebaseUid },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        existingUser: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
        },
      });
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      message: "Test user created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firebaseUid: user.firebaseUid,
      },
      testHeaders: {
        "x-dev-user-id": user._id.toString(),
        "x-dev-username": user.username,
        "x-dev-bypass": "true",
      },
    });
  } catch (error) {
    console.error("Create test user error:", error);
    res.status(500).json({ message: "Server error creating test user" });
  }
});

/**
 * @route   GET /api/dev/users
 * @desc    List all users for testing
 * @access  Development only
 */
router.get("/users", devOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("username email _id firebaseUid totalSneakerCount")
      .limit(20);

    res.json({
      users,
      testInstructions: {
        message: "Use any of these users for testing",
        headers: {
          "x-dev-bypass": "true",
          "x-dev-user-id": "USER_ID_FROM_LIST",
          or: "x-dev-username: USERNAME_FROM_LIST",
        },
      },
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ message: "Server error listing users" });
  }
});

/**
 * @route   POST /api/dev/mock-login
 * @desc    Mock login that returns a fake token for testing
 * @access  Development only
 */
router.post("/mock-login", devOnly, async (req, res) => {
  try {
    const { username, email } = req.body;

    let user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      // Create user if not exists
      const userData = {
        username: username || `user_${Date.now()}`,
        email: email || `${username}@test.com`,
        firebaseUid: `mock_uid_${Date.now()}`,
        profilePhoto: "https://via.placeholder.com/150",
      };

      user = new User(userData);
      await user.save();
    }

    // Return mock token (just base64 encoded user info for testing)
    const mockToken = Buffer.from(
      JSON.stringify({
        uid: user.firebaseUid,
        email: user.email,
        username: user.username,
        userId: user._id,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    ).toString("base64");

    res.json({
      message: "Mock login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      mockToken,
      testingInstructions: {
        postmanUsage: "Use these headers for authenticated requests:",
        headers: {
          "x-dev-bypass": "true",
          "x-dev-user-id": user._id.toString(),
          Authorization: `Bearer ${mockToken}`,
        },
        note: "The Authorization header won't be validated in dev mode with x-dev-bypass=true",
      },
    });
  } catch (error) {
    console.error("Mock login error:", error);
    res.status(500).json({ message: "Server error during mock login" });
  }
});

/**
 * @route   DELETE /api/dev/cleanup
 * @desc    Clean up test data
 * @access  Development only
 */
router.delete("/cleanup", devOnly, async (req, res) => {
  try {
    // Delete users with dev/test firebaseUids
    const result = await User.deleteMany({
      firebaseUid: { $regex: /^(dev_|mock_|test_)/ },
    });

    res.json({
      message: `Cleaned up ${result.deletedCount} test users`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ message: "Server error during cleanup" });
  }
});

module.exports = router;
