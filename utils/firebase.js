const { admin } = require("../config/firebaseAdmin");
const { v4: uuidv4 } = require("uuid");

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token
 * @returns User data from Firebase
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    // Set a reasonable timeout for token verification
    const checkRevoked = true; // Check if token has been revoked
    const decodedToken = await admin
      .auth()
      .verifyIdToken(idToken, checkRevoked);

    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);

    // Add more specific error handling
    if (error.code === "auth/id-token-expired") {
      error.message = "Firebase token has expired. Please login again.";
    } else if (error.code === "auth/id-token-revoked") {
      error.message = "Firebase token has been revoked. Please login again.";
    } else if (error.code === "auth/invalid-id-token") {
      error.message = "Invalid firebase token format.";
    } else if (error.code === "auth/argument-error") {
      error.message = "Invalid token argument provided.";
    }

    throw error;
  }
};

module.exports = {
  verifyFirebaseToken,
};
