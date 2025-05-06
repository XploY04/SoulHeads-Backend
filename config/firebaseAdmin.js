const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  try {
    // Check if app is already initialized
    if (admin.apps.length > 0) {
      logger.info("Firebase Admin already initialized");
      return { admin };
    }

    // Determine the credential source based on environment
    let credential;

    if (process.env.NODE_ENV === "production" && process.env.FIREBASE_CONFIG) {
      // In production, prefer environment variable config
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
        credential = admin.credential.cert(serviceAccount);
        logger.info("Using Firebase config from environment variable");
      } catch (parseError) {
        logger.error(
          "Error parsing Firebase config from environment:",
          parseError
        );
        throw new Error(
          "Invalid Firebase configuration in environment variable"
        );
      }
    } else {
      // Look for service account key file
      const serviceAccountPath = path.join(
        __dirname,
        "..",
        "soulheads-firebase-adminsdk-fbsvc-62da09beab.json"
      );

      if (fs.existsSync(serviceAccountPath)) {
        try {
          const serviceAccount = require(serviceAccountPath);
          credential = admin.credential.cert(serviceAccount);
          logger.info("Using Firebase config from service account file");
        } catch (fileError) {
          logger.error(
            "Error loading Firebase service account file:",
            fileError
          );
          throw new Error("Invalid Firebase service account file");
        }
      } else {
        logger.error("Firebase service account file not found");
        throw new Error("Firebase service account file not found");
      }
    }

    // Initialize the app
    admin.initializeApp({
      credential: credential,
      // Add other configs if needed
    });

    logger.info("Firebase Admin SDK initialized successfully");
    return { admin };
  } catch (error) {
    logger.error("Firebase Admin initialization failed:", error);
    throw error;
  }
};

module.exports = {
  admin,
  initializeFirebaseAdmin,
};
