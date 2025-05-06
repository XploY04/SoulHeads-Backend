const { verifyFirebaseToken } = require("../utils/firebase");
const User = require("../models/User");

/**
 * Authentication middleware using Firebase token verification
 */
const authenticate = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied" });
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    if (!token || token === "undefined" || token === "null") {
      return res
        .status(401)
        .json({ message: "Invalid token format, authorization denied" });
    }

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(token);
    } catch (tokenError) {
      if (tokenError.code === "auth/id-token-expired") {
        return res
          .status(401)
          .json({
            message: "Token has expired, please log in again",
            code: "TOKEN_EXPIRED",
          });
      }

      if (tokenError.code === "auth/id-token-revoked") {
        return res
          .status(401)
          .json({
            message: "Token has been revoked, please log in again",
            code: "TOKEN_REVOKED",
          });
      }

      return res
        .status(401)
        .json({ message: "Token verification failed", code: "TOKEN_INVALID" });
    }

    if (!decodedToken.uid) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Find user in our database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
        firebaseUid: decodedToken.uid,
      });
    }

    // Attach user to request object
    req.user = user;
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Server error during authentication" });
  }
};

/**
 * Optional authentication - doesn't return error if no token provided
 * Useful for public endpoints that may have additional data for logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token, but that's ok - continue as guest
      return next();
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    if (!token || token === "undefined" || token === "null") {
      // Invalid token, but that's ok - continue as guest
      return next();
    }

    // Try to verify the Firebase token
    try {
      const decodedToken = await verifyFirebaseToken(token);

      // Find user in our database
      const user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (user) {
        // Attach user to request object
        req.user = user;
        req.firebaseUser = decodedToken;
      }
    } catch (tokenError) {
      // Token verification failed, but that's ok - continue as guest
      console.warn(
        "Optional auth token verification failed:",
        tokenError.message
      );
    }

    next();
  } catch (error) {
    // Continue as guest in case of any errors
    console.error("Optional authentication error:", error);
    next();
  }
};

module.exports = { authenticate, optionalAuth };
