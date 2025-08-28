const User = require("../models/User");

/**
 * Development-only authentication middleware
 * Bypasses Firebase token verification for easier testing
 *
 * Usage: Add header "x-dev-user-id" with a valid MongoDB user ID
 * or "x-dev-username" with a username to authenticate as that user
 */
const authenticateDev = async (req, res, next) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        message: "Development authentication not allowed in production",
      });
    }

    // Check for development headers
    const devUserId = req.headers["x-dev-user-id"];
    const devUsername = req.headers["x-dev-username"];

    if (!devUserId && !devUsername) {
      return res.status(401).json({
        message:
          "Development auth: Please provide x-dev-user-id or x-dev-username header",
      });
    }

    let user;

    // Find user by ID or username
    if (devUserId) {
      user = await User.findById(devUserId);
    } else if (devUsername) {
      user = await User.findOne({ username: devUsername });
    }

    if (!user) {
      return res.status(404).json({
        message: "Development auth: User not found",
        providedId: devUserId,
        providedUsername: devUsername,
      });
    }

    // Attach user to request object (same as production auth)
    req.user = user;
    req.firebaseUser = {
      uid: user.firebaseUid || "dev-uid",
      email: user.email,
      name: user.username,
    };

    console.log(`[DEV AUTH] Authenticated as: ${user.username} (${user._id})`);
    next();
  } catch (error) {
    console.error("Development authentication error:", error);
    res
      .status(500)
      .json({ message: "Server error during development authentication" });
  }
};

/**
 * Mock Firebase token for development
 * Creates a temporary user if needed
 */
const mockFirebaseAuth = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        message: "Mock authentication not allowed in production",
      });
    }

    const mockEmail = req.headers["x-mock-email"] || "dev@test.com";
    const mockUsername = req.headers["x-mock-username"] || "devuser";
    const mockUid = req.headers["x-mock-uid"] || "dev-firebase-uid-123";

    // Find or create user
    let user = await User.findOne({ firebaseUid: mockUid });

    if (!user) {
      // Check if username exists
      const existingUser = await User.findOne({ username: mockUsername });
      if (existingUser) {
        return res.status(400).json({
          message: `Username ${mockUsername} already exists. Use x-mock-username header with different value.`,
        });
      }

      // Create new mock user
      user = new User({
        username: mockUsername,
        email: mockEmail,
        firebaseUid: mockUid,
        profilePhoto: "https://via.placeholder.com/150",
      });
      await user.save();
      console.log(`[MOCK AUTH] Created new user: ${mockUsername}`);
    }

    req.user = user;
    req.firebaseUser = {
      uid: mockUid,
      email: mockEmail,
      name: mockUsername,
    };

    console.log(`[MOCK AUTH] Authenticated as: ${user.username} (${user._id})`);
    next();
  } catch (error) {
    console.error("Mock authentication error:", error);
    res
      .status(500)
      .json({ message: "Server error during mock authentication" });
  }
};

module.exports = { authenticateDev, mockFirebaseAuth };
