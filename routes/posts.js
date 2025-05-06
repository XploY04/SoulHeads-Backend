const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");
const Sneaker = require("../models/Sneaker");
const {
  setCache,
  getCache,
  deleteCache,
  cacheKeys,
} = require("../utils/redis");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const { uploadToCloudinary } = require("../utils/cloudinary");
const upload = multer({ memory: true });

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const {
        brandName,
        sneakerName,
        description,
        purchaseLink,
        purchaseAddress,
        price,
        year,
      } = req.body;

      // Validate required fields
      if (!brandName || !sneakerName || !description) {
        return res.status(400).json({
          message: "Brand name, sneaker name, and description are required",
        });
      }

      if (!req.files || !req.files.mainImage) {
        return res.status(400).json({ message: "Main image is required" });
      }

      // Process main image
      const mainImageFile = req.files.mainImage[0];
      const mainImagePath = `posts/${req.user._id}/main-${Date.now()}`;
      const mainImageUrl = await uploadToCloudinary(
        mainImageFile.buffer,
        mainImagePath,
        mainImageFile.mimetype
      );

      // Process additional images if provided
      const additionalImageUrls = [];
      if (req.files.additionalImages) {
        const uploadPromises = req.files.additionalImages.map((file, index) => {
          const filePath = `posts/${
            req.user._id
          }/additional-${Date.now()}-${index}`;
          return uploadToCloudinary(file.buffer, filePath, file.mimetype);
        });

        const results = await Promise.all(uploadPromises);
        additionalImageUrls.push(...results);
      }

      // Find or create the sneaker
      let sneaker = await Sneaker.findOne({
        sneakerName: { $regex: new RegExp(`^${sneakerName}$`, "i") },
        brandName: { $regex: new RegExp(`^${brandName}$`, "i") },
      });

      if (!sneaker) {
        sneaker = new Sneaker({
          sneakerName,
          brandName,
          minPrice: price ? Number(price) : 0,
          maxPrice: price ? Number(price) : 0,
        });
        await sneaker.save();
      }

      if (sneaker) {
        const minPrice = sneaker.minPrice;
        const maxPrice = sneaker.maxPrice;
        if (price > maxPrice) {
          await Sneaker.findByIdAndUpdate(sneaker._id, {
            $set: { maxPrice: price },
          });
        } else if (price < minPrice) {
          await Sneaker.findByIdAndUpdate(sneaker._id, {
            $set: { minPrice: price },
          });
        }
      }

      // Create post
      const newPost = new Post({
        userId: req.user._id,
        sneakerId: sneaker._id,
        mainImage: mainImageUrl,
        additionalImages: additionalImageUrls,
        brandName,
        sneakerName,
        description,
        purchaseLink,
        purchaseAddress,
        price: price ? Number(price) : undefined,
        year: year ? Number(year) : undefined,
      });

      await newPost.save();

      // Update sneaker with post reference
      await Sneaker.findByIdAndUpdate(sneaker._id, {
        $push: { posts: newPost._id },
      });

      // Update user's sneaker count if this is a new sneaker they've posted
      const userSneakerCount = await Post.distinct("sneakerId", {
        userId: req.user._id,
      }).length;
      await User.findByIdAndUpdate(req.user._id, {
        totalSneakerCount: userSneakerCount,
      });

      // Clear cache for top rated sneakers since there's a new post
      await deleteCache(cacheKeys.topRatedSneakers);

      res.status(201).json({
        message: "Post created successfully",
        post: newPost,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ message: "Server error creating post" });
    }
  }
);

/**
 * @route   GET /api/posts
 * @desc    Get all posts with pagination
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username profilePhoto")
      .populate("sneakerId", "sneakerName brandName averageRating");

    const total = await Post.countDocuments();

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Server error fetching posts" });
  }
});

/**
 * @route   GET /api/posts/:userId
 * @desc    Get posts of the users that the current user follows
 * @access  Private
 */
router.get("/following", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).populate("following");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingIds = user.following.map((user) => user._id);

    const posts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username profilePhoto")
      .populate("sneakerId", "sneakerName brandName averageRating");

    const total = await Post.countDocuments({ userId: { $in: followingIds } });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });
  } catch (error) {
    console.error("Get following posts error:", error);
    res.status(500).json({ message: "Server error fetching following posts" });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id)
      .populate("userId", "username profilePhoto")
      .populate("sneakerId", "sneakerName brandName averageRating");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get like count from cache if available
    const likeCountKey = cacheKeys.postLikeCount(post._id);
    let likeCount = await getCache(likeCountKey);

    if (likeCount === null) {
      likeCount = post.likes.length;
      // Cache for 1 hour
      await setCache(likeCountKey, likeCount, 3600);
    }

    res.status(200).json({
      post,
      likeCount,
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Server error fetching post" });
  }
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the owner of the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    const { description, purchaseLink, purchaseAddress, price, year } =
      req.body;

    // Update only the fields that are provided
    const updateData = {};
    if (description) updateData.description = description;
    if (purchaseLink) updateData.purchaseLink = purchaseLink;
    if (purchaseAddress) updateData.purchaseAddress = purchaseAddress;
    if (price) updateData.price = Number(price);
    if (year) updateData.year = Number(year);

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Server error updating post" });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the owner of the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    // Delete images from Cloudinary
    try {
      const mainImagePath = post.mainImage.split("/").pop().split("?")[0];
      await cloudinary.uploader.destroy(
        `posts/${req.user._id}/${mainImagePath}`
      );

      if (post.additionalImages && post.additionalImages.length > 0) {
        post.additionalImages.forEach(async (imageUrl) => {
          const imagePath = imageUrl.split("/").pop().split("?")[0];
          await cloudinary.uploader.destroy(
            `posts/${req.user._id}/${imagePath}`
          );
        });
      }
    } catch (storageError) {
      console.error("Error deleting images from storage:", storageError);
      // Continue with post deletion even if image deletion fails
    }

    // Remove post reference from sneaker
    await Sneaker.findByIdAndUpdate(post.sneakerId, {
      $pull: { posts: post._id },
    });

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    // Update user's sneaker count
    const userSneakers = await Post.distinct("sneakerId", {
      userId: req.user._id,
    });
    await User.findByIdAndUpdate(req.user._id, {
      totalSneakerCount: userSneakers.length,
    });

    // Clear caches
    await Promise.all([
      deleteCache(cacheKeys.postLikeCount(post._id)),
      deleteCache(cacheKeys.topRatedSneakers),
    ]);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error deleting post" });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like or unlike a post
 * @access  Private
 */
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user already liked the post
    const alreadyLiked = post.likes.includes(req.user._id);

    let message;

    if (alreadyLiked) {
      // Unlike the post
      await Post.findByIdAndUpdate(req.params.id, {
        $pull: { likes: req.user._id },
      });
      message = "Post unliked successfully";
    } else {
      // Like the post
      await Post.findByIdAndUpdate(req.params.id, {
        $push: { likes: req.user._id },
      });
      message = "Post liked successfully";
    }

    // Update the like count in cache
    const updatedPost = await Post.findById(req.params.id);
    await setCache(
      cacheKeys.postLikeCount(post._id),
      updatedPost.likes.length,
      3600
    );

    res.status(200).json({
      message,
      likeCount: updatedPost.likes.length,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error processing like" });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by a specific user
 * @access  Public
 */
router.get("/user/:userId", async (req, res) => {
  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username profilePhoto")
      .populate("sneakerId", "sneakerName brandName averageRating");

    const total = await Post.countDocuments({ userId: req.params.userId });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ message: "Server error fetching user posts" });
  }
});

module.exports = router;
