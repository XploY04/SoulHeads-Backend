const admin = require('firebase-admin');
const path = require('path');

// Get path to service account file
const serviceAccount = require(path.join(__dirname, '..', 'soulheads-firebase-adminsdk-fbsvc-62da09beab.json'));

// Initialize Firebase Admin with service account
const initializeFirebaseAdmin = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'soulheads.appspot.com'
    });
    console.log('Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

module.exports = { admin, initializeFirebaseAdmin };