const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");
const {
  verifyFirebaseToken,
  uploadToFirebaseStorage,
} = require("../utils/firebase");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const { uploadToCloudinary } = require("../utils/cloudinary");
const upload = multer({ memory: true });

/**
 * @route   POST /api/auth/register
 * @desc    Register user after Firebase authentication
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { idToken, username, email } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);

    // Check if user already exists in our database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // Create new user in our database
    user = new User({
      username,
      email: email || decodedToken.email,
      firebaseUid: decodedToken.uid,
      profilePhoto: decodedToken.picture || "",
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with Firebase token and retrieve user profile
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);

    // Find user in our database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({
        message: "User not found in database. Please register first.",
        firebaseUser: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
        },
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        totalSneakerCount: user.totalSneakerCount,
        followers: user.followers.length,
        following: user.following.length,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-__v -password");

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        totalSneakerCount: user.totalSneakerCount,
        followers: user.followers.length,
        following: user.following.length,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { username } = req.body;

    // Check if new username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user._id },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { username: username || req.user.username } },
      { new: true }
    ).select("-__v -password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto,
        totalSneakerCount: updatedUser.totalSneakerCount,
        followers: updatedUser.followers.length,
        following: updatedUser.following.length,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

/**
 * @route   POST /api/auth/profile/photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
  "/profile/photo",
  authenticate,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBuffer = req.file.buffer;

      // Upload to Cloudinary - you'll need to implement this function in your utils
      const result = await cloudinary.uploadToCloudinary(fileBuffer);
      const photoUrl = result.secure_url;

      // Update user profile with new photo URL
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { profilePhoto: photoUrl } },
        { new: true }
      ).select("-__v -password");

      res.status(200).json({
        message: "Profile photo updated successfully",
        profilePhoto: photoUrl,
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          profilePhoto: updatedUser.profilePhoto,
        },
      });
    } catch (error) {
      console.error("Profile photo upload error:", error);
      res.status(500).json({ message: "Server error uploading profile photo" });
    }
  }
);

module.exports = router;
