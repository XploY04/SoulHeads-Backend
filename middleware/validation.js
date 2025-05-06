// filepath: c:\Users\YASH\Documents\Github\SoulHeads\middleware\validation.js
const { body, param, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

// Validate MongoDB ObjectID
const validateObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error("Invalid ID format");
  }
  return true;
};

// Auth validation rules
const authValidation = {
  register: [
    body("idToken").notEmpty().withMessage("Firebase ID token is required"),
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers and underscores"
      ),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    checkValidation,
  ],
  login: [
    body("idToken").notEmpty().withMessage("Firebase ID token is required"),
    checkValidation,
  ],
};

// User validation rules
const userValidation = {
  getUser: [
    param("username").notEmpty().withMessage("Username is required"),
    checkValidation,
  ],
  followUser: [
    param("id").custom(validateObjectId).withMessage("Invalid user ID format"),
    checkValidation,
  ],
  updateProfile: [
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers and underscores"
      ),
    checkValidation,
  ],
};

// Post validation rules
const postValidation = {
  createPost: [
    body("brandName")
      .notEmpty()
      .withMessage("Brand name is required")
      .isLength({ max: 50 })
      .withMessage("Brand name cannot exceed 50 characters"),
    body("sneakerName")
      .notEmpty()
      .withMessage("Sneaker name is required")
      .isLength({ max: 100 })
      .withMessage("Sneaker name cannot exceed 100 characters"),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),
    body("price")
      .optional()
      .isNumeric()
      .withMessage("Price must be a number")
      .custom((value) => value >= 0)
      .withMessage("Price cannot be negative"),
    body("year")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Year must be between 1900 and ${new Date().getFullYear() + 1}`
      ),
    body("purchaseLink")
      .optional()
      .isURL()
      .withMessage("Purchase link must be a valid URL"),
    checkValidation,
  ],
  getPostById: [
    param("id").custom(validateObjectId).withMessage("Invalid post ID format"),
    checkValidation,
  ],
  updatePost: [
    param("id").custom(validateObjectId).withMessage("Invalid post ID format"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),
    body("price")
      .optional()
      .isNumeric()
      .withMessage("Price must be a number")
      .custom((value) => value >= 0)
      .withMessage("Price cannot be negative"),
    body("year")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage(
        `Year must be between 1900 and ${new Date().getFullYear() + 1}`
      ),
    body("purchaseLink")
      .optional()
      .isURL()
      .withMessage("Purchase link must be a valid URL"),
    checkValidation,
  ],
  getPaginatedPosts: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    checkValidation,
  ],
};

// Sneaker validation rules
const sneakerValidation = {
  getSneaker: [
    param("id")
      .custom(validateObjectId)
      .withMessage("Invalid sneaker ID format"),
    checkValidation,
  ],
  rateSneaker: [
    param("id")
      .custom(validateObjectId)
      .withMessage("Invalid sneaker ID format"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    checkValidation,
  ],
  searchSneakers: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    checkValidation,
  ],
};

module.exports = {
  authValidation,
  userValidation,
  postValidation,
  sneakerValidation,
};
