const { admin } = require('../config/firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token
 * @returns User data from Firebase
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid or expired auth token');
  }
};

// /**
//  * Upload file to Firebase Storage
//  * @param {Buffer} fileBuffer - File as buffer
//  * @param {string} filePath - Path in storage bucket
//  * @param {string} contentType - MIME type
//  * @returns {Promise<string>} - Download URL
//  */
// const uploadToFirebaseStorage = async (fileBuffer, filePath, contentType) => {
//   try {
//     const bucket = admin.storage().bucket();
//     const file = bucket.file(filePath);
    
//     await file.save(fileBuffer, {
//       contentType,
//       metadata: {
//         firebaseStorageDownloadTokens: uuidv4(),
//       }
//     });

//     const [url] = await file.getSignedUrl({
//       action: 'read',
//       expires: '03-01-2500', // Far future
//     });

//     return url;
//   } catch (error) {
//     console.error('Error uploading to Firebase Storage:', error);
//     throw error;
//   }
// };

// /**
//  * Create signed URL for client-side uploads
//  * @param {string} filePath - Path in storage bucket
//  * @returns {Promise<string>} - Signed URL for upload
//  */
// const createUploadSignedUrl = async (filePath) => {
//   try {
//     const bucket = admin.storage().bucket();
//     const file = bucket.file(filePath);
    
//     const [signedUrl] = await file.getSignedUrl({
//       action: 'write',
//       expires: Date.now() + 15 * 60 * 1000, // 15 minutes
//       contentType: 'application/octet-stream',
//     });
    
//     return signedUrl;
//   } catch (error) {
//     console.error('Error creating signed URL:', error);
//     throw error;
//   }
// };

// /**
//  * Delete file from Firebase Storage
//  * @param {string} filePath - Path in storage bucket
//  * @returns {Promise<boolean>} - Success status
//  */
// const deleteFromFirebaseStorage = async (filePath) => {
//   try {
//     const bucket = admin.storage().bucket();
//     await bucket.file(filePath).delete();
//     return true;
//   } catch (error) {
//     console.error('Error deleting from Firebase Storage:', error);
//     return false;
//   }
// };

module.exports = {
  verifyFirebaseToken,
  // uploadToFirebaseStorage,
  // createUploadSignedUrl,
  // deleteFromFirebaseStorage
};