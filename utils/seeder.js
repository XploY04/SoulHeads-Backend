const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Post = require('../models/Post');
const Sneaker = require('../models/Sneaker');

// Load environment variables
dotenv.config();

// Sample data
const users = [
  {
    username: 'sneakerhead123',
    email: 'sneakerhead@example.com',
    profilePhoto: 'https://example.com/avatar1.jpg',
    firebaseUid: 'firebase-uid-1'
  },
  {
    username: 'kickscollector',
    email: 'kicks@example.com',
    profilePhoto: 'https://example.com/avatar2.jpg',
    firebaseUid: 'firebase-uid-2'
  },
  {
    username: 'airjordan_fan',
    email: 'jordan@example.com',
    profilePhoto: 'https://example.com/avatar3.jpg',
    firebaseUid: 'firebase-uid-3'
  }
];

const sneakers = [
  {
    sneakerName: 'Air Jordan 1 Chicago',
    brandName: 'Nike',
  },
  {
    sneakerName: 'Yeezy Boost 350',
    brandName: 'Adidas',
  },
  {
    sneakerName: 'Chuck Taylor All-Star',
    brandName: 'Converse',
  },
  {
    sneakerName: 'Old Skool',
    brandName: 'Vans',
  },
  {
    sneakerName: 'Suede Classic',
    brandName: 'Puma',
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding');
    
    try {
      // Clear existing data
      await User.deleteMany({});
      await Sneaker.deleteMany({});
      await Post.deleteMany({});
      
      console.log('Previous data cleared');
      
      // Insert users
      const createdUsers = await User.insertMany(users);
      console.log(`${createdUsers.length} users created`);
      
      // Insert sneakers
      const createdSneakers = await Sneaker.insertMany(sneakers);
      console.log(`${createdSneakers.length} sneakers created`);
      
      // Create posts for each user
      const posts = [];
      
      for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        
        for (let j = 0; j < 2; j++) { // Each user creates 2 posts
          const sneaker = createdSneakers[Math.floor(Math.random() * createdSneakers.length)];
          
          posts.push({
            userId: user._id,
            sneakerId: sneaker._id,
            mainImage: `https://example.com/sneaker${i}${j}.jpg`,
            additionalImages: [
              `https://example.com/sneaker${i}${j}_detail1.jpg`,
              `https://example.com/sneaker${i}${j}_detail2.jpg`
            ],
            brandName: sneaker.brandName,
            sneakerName: sneaker.sneakerName,
            description: `This is my awesome ${sneaker.sneakerName} from ${sneaker.brandName}!`,
            price: 120 + (Math.floor(Math.random() * 180)),
            year: 2020 + (Math.floor(Math.random() * 4))
          });
        }
      }
      
      // Insert posts
      const createdPosts = await Post.insertMany(posts);
      console.log(`${createdPosts.length} posts created`);
      
      // Update sneakers with post references
      for (let post of createdPosts) {
        await Sneaker.findByIdAndUpdate(post.sneakerId, {
          $push: { posts: post._id }
        });
      }
      
      // Add some likes and ratings to posts
      for (let post of createdPosts) {
        const likingUsers = createdUsers
          .filter(() => Math.random() > 0.3) // 70% chance a user will like a post
          .map(user => user._id);
        
        await Post.findByIdAndUpdate(post._id, {
          $set: { likes: likingUsers }
        });
        
        // Add ratings
        for (const user of createdUsers) {
          if (Math.random() > 0.3) { // 70% chance a user will rate a sneaker
            const rating = Math.floor(Math.random() * 5) + 1; // Rating 1-5
            
            const sneaker = await Sneaker.findById(post.sneakerId);
            
            const existingRatingIndex = sneaker.ratings.findIndex(
              r => r.userId.toString() === user._id.toString()
            );
            
            if (existingRatingIndex === -1) {
              sneaker.ratings.push({
                userId: user._id,
                rating
              });
              
              sneaker.calculateAverageRating();
              await sneaker.save();
            }
          }
        }
      }
      
      // Create some followers
      for (let i = 0; i < createdUsers.length; i++) {
        const user = createdUsers[i];
        const followingUsers = createdUsers
          .filter(u => u._id.toString() !== user._id.toString() && Math.random() > 0.3)
          .map(u => u._id);
        
        if (followingUsers.length > 0) {
          await User.findByIdAndUpdate(user._id, {
            $set: { following: followingUsers }
          });
          
          // Update the followers of those users
          for (const followingId of followingUsers) {
            await User.findByIdAndUpdate(followingId, {
              $push: { followers: user._id }
            });
          }
        }
      }
      
      console.log('Database seeded successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Error seeding database:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });