const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Sneaker = require('../models/Sneaker');
const Post = require('../models/Post');
const { setCache, getCache, deleteCache, cacheKeys } = require('../utils/redis');
const mongoose = require('mongoose');

/**
 * @route   GET /api/sneakers
 * @desc    Get all sneakers with pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const brandFilter = req.query.brand ? { brandName: { $regex: new RegExp(req.query.brand, 'i') } } : {};
    
    const sneakers = await Sneaker.find(brandFilter)
      .sort({ averageRating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('sneakerName brandName averageRating');
      
    const total = await Sneaker.countDocuments(brandFilter);
    
    res.status(200).json({
      sneakers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalSneakers: total
    });
  } catch (error) {
    console.error('Get sneakers error:', error);
    res.status(500).json({ message: 'Server error fetching sneakers' });
  }
});

/**
 * @route   GET /api/sneakers/top
 * @desc    Get top rated sneakers
 * @access  Public
 */
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Try to get from cache first
    const cachedTopSneakers = await getCache(cacheKeys.topRatedSneakers);
    
    if (cachedTopSneakers) {
      return res.status(200).json({
        sneakers: cachedTopSneakers.slice(0, limit),
        fromCache: true
      });
    }
    
    // If not in cache, get from database
    const topSneakers = await Sneaker.find({ averageRating: { $gt: 0 } })
      .sort({ averageRating: -1 })
      .limit(50) // Cache more than we need
      .select('sneakerName brandName averageRating');
    
    // Store in cache for 2 hours
    await setCache(cacheKeys.topRatedSneakers, topSneakers, 7200);
    
    res.status(200).json({
      sneakers: topSneakers.slice(0, limit),
      fromCache: false
    });
  } catch (error) {
    console.error('Get top sneakers error:', error);
    res.status(500).json({ message: 'Server error fetching top sneakers' });
  }
});

/**
 * @route   GET /api/sneakers/:id
 * @desc    Get sneaker details by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate sneaker ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sneaker ID' });
    }
    
    const sneaker = await Sneaker.findById(req.params.id);
    
    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }
    
    // Get posts for this sneaker
    const posts = await Post.find({ sneakerId: sneaker._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username profilePhoto');
    
    // Get rating count and average
    const ratingCount = sneaker.ratings.length;
    const averageRating = sneaker.averageRating;
    
    res.status(200).json({
      sneaker: {
        id: sneaker._id,
        sneakerName: sneaker.sneakerName,
        brandName: sneaker.brandName,
        averageRating,
        ratingCount,
        postCount: sneaker.posts.length
      },
      recentPosts: posts
    });
  } catch (error) {
    console.error('Get sneaker error:', error);
    res.status(500).json({ message: 'Server error fetching sneaker details' });
  }
});

/**
 * @route   POST /api/sneakers/:id/rate
 * @desc    Rate a sneaker
 * @access  Private
 */
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    // Validate sneaker ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sneaker ID' });
    }
    
    const { rating } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const sneaker = await Sneaker.findById(req.params.id);
    
    if (!sneaker) {
      return res.status(404).json({ message: 'Sneaker not found' });
    }
    
    // Check if user has already rated this sneaker
    const existingRatingIndex = sneaker.ratings.findIndex(
      r => r.userId.toString() === req.user._id.toString()
    );
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      sneaker.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      sneaker.ratings.push({
        userId: req.user._id,
        rating
      });
    }
    
    // Calculate new average rating
    sneaker.calculateAverageRating();
    
    await sneaker.save();
    
    // Update all posts with this sneaker to reflect the new rating
    await Post.updateMany(
      { sneakerId: sneaker._id },
      { $set: { 'sneakerRatings.$[elem].rating': rating } },
      { arrayFilters: [{ 'elem.userId': req.user._id }], upsert: true }
    );
    
    // Clear top rated sneakers cache
    await deleteCache(cacheKeys.topRatedSneakers);
    await deleteCache(cacheKeys.sneakerRatingAvg(sneaker._id));
    
    res.status(200).json({
      message: 'Sneaker rated successfully',
      averageRating: sneaker.averageRating,
      ratingCount: sneaker.ratings.length
    });
  } catch (error) {
    console.error('Rate sneaker error:', error);
    res.status(500).json({ message: 'Server error rating sneaker' });
  }
});

/**
 * @route   GET /api/sneakers/search/:query
 * @desc    Search for sneakers
 * @access  Public
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search by name or brand
    const sneakers = await Sneaker.find({
      $or: [
        { sneakerName: { $regex: query, $options: 'i' } },
        { brandName: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ averageRating: -1 })
    .skip(skip)
    .limit(limit)
    .select('sneakerName brandName averageRating');
    
    const total = await Sneaker.countDocuments({
      $or: [
        { sneakerName: { $regex: query, $options: 'i' } },
        { brandName: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.status(200).json({
      sneakers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    });
  } catch (error) {
    console.error('Search sneakers error:', error);
    res.status(500).json({ message: 'Server error searching sneakers' });
  }
});

/**
 * @route   GET /api/sneakers/brand/:brandName
 * @desc    Get sneakers by brand
 * @access  Public
 */
router.get('/brand/:brandName', async (req, res) => {
  try {
    const { brandName } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const sneakers = await Sneaker.find({ 
      brandName: { $regex: new RegExp(`^${brandName}$`, 'i') }
    })
    .sort({ averageRating: -1 })
    .skip(skip)
    .limit(limit)
    .select('sneakerName brandName averageRating');
    
    const total = await Sneaker.countDocuments({ 
      brandName: { $regex: new RegExp(`^${brandName}$`, 'i') }
    });
    
    res.status(200).json({
      brand: brandName,
      sneakers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalSneakers: total
    });
  } catch (error) {
    console.error('Get brand sneakers error:', error);
    res.status(500).json({ message: 'Server error fetching brand sneakers' });
  }
});

module.exports = router;