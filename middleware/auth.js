const { verifyFirebaseToken } = require('../utils/firebase');
const User = require('../models/User');

/**
 * Authentication middleware using Firebase token verification
 */
const authenticate = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    // Verify the Firebase token
    const decodedToken = await verifyFirebaseToken(token);
    
    // Find user in our database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = { authenticate };