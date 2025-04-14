const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sneakerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sneaker',
    required: true
  },
  mainImage: {
    type: String,
    required: true
  },
  additionalImages: {
    type: [String],
    validate: [arrayLimit, 'Additional images cannot exceed 3']
  },
  brandName: {
    type: String,
    required: true
  },
  sneakerName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  purchaseLink: String,
  purchaseAddress: String,
  price: Number,
  year: Number,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sneakerRatings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Validation function to limit additional images to maximum 3
function arrayLimit(val) {
  return val.length <= 3;
}

module.exports = mongoose.model('Post', postSchema);