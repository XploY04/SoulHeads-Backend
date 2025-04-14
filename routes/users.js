const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const { setCache, getCache, deleteCache, cacheKeys } = require('../utils/redis');
const mongoose = require('mongoose');

/**
 * @route   GET /api/users/:username
 * @desc    Get user profile by username
 * @access  Public
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('-__v -password -firebaseUid');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get post count
    const postCount = await Post.countDocuments({ userId: user._id });
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        profilePhoto: user.profilePhoto,
        totalSneakerCount: user.totalSneakerCount,
        followers: user.followers.length,
        following: user.following.length,
        postCount,
        posts: user.posts
      }
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

/**
 * @route   POST /api/users/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    // Check if user ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Can't follow yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already following
    if (req.user.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }
    
    // Update both users
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: userToFollow._id }
    });
    
    await User.findByIdAndUpdate(userToFollow._id, {
      $push: { followers: req.user._id }
    });
    
    // Update cache for follower counts
    await Promise.all([
      deleteCache(cacheKeys.userFollowerCount(userToFollow._id)),
      deleteCache(cacheKeys.userFollowingCount(req.user._id))
    ]);
    
    res.status(200).json({ message: `You are now following ${userToFollow.username}` });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error following user' });
  }
});

/**
 * @route   POST /api/users/:id/unfollow
 * @desc    Unfollow a user
 * @access  Private
 */
router.post('/:id/unfollow', authenticate, async (req, res) => {
  try {
    // Check if user ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Can't unfollow yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }
    
    const userToUnfollow = await User.findById(req.params.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if actually following
    if (!req.user.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }
    
    // Update both users
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userToUnfollow._id }
    });
    
    await User.findByIdAndUpdate(userToUnfollow._id, {
      $pull: { followers: req.user._id }
    });
    
    // Update cache for follower counts
    await Promise.all([
      deleteCache(cacheKeys.userFollowerCount(userToUnfollow._id)),
      deleteCache(cacheKeys.userFollowingCount(req.user._id))
    ]);
    
    res.status(200).json({ message: `You have unfollowed ${userToUnfollow.username}` });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error unfollowing user' });
  }
});

/**
 * @route   GET /api/users/:id/followers
 * @desc    Get user followers
 * @access  Public
 */
router.get('/:id/followers', async (req, res) => {
  try {
    // Check if user ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePhoto');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Try to get follower count from cache first
    const cacheKey = cacheKeys.userFollowerCount(user._id);
    let followerCount = await getCache(cacheKey);
    
    if (followerCount === null) {
      followerCount = user.followers.length;
      // Cache for 1 hour
      await setCache(cacheKey, followerCount, 3600);
    }
    
    res.status(200).json({
      followers: user.followers,
      count: followerCount
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error getting followers' });
  }
});

/**
 * @route   GET /api/users/:id/following
 * @desc    Get users that this user follows
 * @access  Public
 */
router.get('/:id/following', async (req, res) => {
  try {
    // Check if user ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(req.params.id)
      .populate('following', 'username profilePhoto');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Try to get following count from cache first
    const cacheKey = cacheKeys.userFollowingCount(user._id);
    let followingCount = await getCache(cacheKey);
    
    if (followingCount === null) {
      followingCount = user.following.length;
      // Cache for 1 hour
      await setCache(cacheKey, followingCount, 3600);
    }
    
    res.status(200).json({
      following: user.following,
      count: followingCount
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error getting following users' });
  }
});

module.exports = router;