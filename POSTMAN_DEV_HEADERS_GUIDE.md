# 🚀 SoulHeads Postman Collection - Development Headers Guide

## 📋 Quick Setup for Testing

The SoulHeads Postman collection has been updated with development headers for easy testing without Firebase tokens.

## 🔧 Development Headers

Add these headers to **any authenticated endpoint** for easy testing:

```json
{
  "key": "x-dev-bypass",
  "value": "true",
  "description": "Development mode bypass"
},
{
  "key": "x-dev-username",
  "value": "{{dev_username}}",
  "description": "Development username for testing"
}
```

## ✅ Endpoints Already Updated

The following endpoints already include the development headers:

### 🔐 Authentication

- ✅ Get User Profile
- ✅ Update Profile
- ✅ Upload Profile Photo

### 👥 Users

- ✅ Follow a User
- ✅ Unfollow a User

### 📱 Posts

- ✅ Create Post
- ✅ Get Following Posts

### 🧪 Development & Testing

- ✅ Test Auth with Dev Headers (example)

## 📝 How to Add Headers to Other Endpoints

For any other authenticated endpoint, simply copy these headers:

### In Postman:

1. Open any request that needs authentication
2. Go to the "Headers" tab
3. Add these two headers:
   - `x-dev-bypass` = `true`
   - `x-dev-username` = `{{dev_username}}`
4. Keep the existing `Authorization` header (it won't be used but maintains compatibility)

### Quick Copy-Paste Headers:

```
x-dev-bypass: true
x-dev-username: {{dev_username}}
```

## 🎯 Variables Setup

Make sure you have these variables set in your Postman environment:

```json
{
  "base_url": "http://localhost:5000",
  "dev_username": "testuser123",
  "dev_user_id": "USER_ID_PLACEHOLDER"
}
```

## 📚 Complete List of Endpoints That Need Headers

### Authenticated Endpoints (add dev headers):

- `POST /api/auth/profile` - Update Profile ✅
- `GET /api/auth/profile` - Get User Profile ✅
- `POST /api/auth/profile/photo` - Upload Profile Photo ✅
- `POST /api/users/:id/follow` - Follow User ✅
- `POST /api/users/:id/unfollow` - Unfollow User ✅
- `POST /api/posts` - Create Post ✅
- `GET /api/posts/following` - Get Following Posts ✅
- `PUT /api/posts/:id` - Update Post
- `DELETE /api/posts/:id` - Delete Post
- `POST /api/posts/:id/like` - Like/Unlike Post
- `POST /api/sneakers/:id/rate` - Rate Sneaker

### Public Endpoints (no headers needed):

- `GET /api/posts` - Get All Posts
- `GET /api/posts/:id` - Get Single Post
- `GET /api/posts/user/:userId` - Get User's Posts
- `GET /api/users/:username` - Get User Profile by Username
- `GET /api/users/:id/followers` - Get User Followers
- `GET /api/users/:id/following` - Get User Following
- `GET /api/sneakers` - Get All Sneakers
- `GET /api/sneakers/top` - Get Top Rated Sneakers
- `GET /api/sneakers/:id` - Get Sneaker Details
- `GET /api/sneakers/search/:query` - Search Sneakers
- `GET /api/sneakers/brand/:brandName` - Get Sneakers by Brand

## 🚀 Testing Workflow

1. **Start Server**: `npm run dev` (make sure `NODE_ENV=development`)
2. **Create Test User**: Use `/api/dev/create-user` endpoint
3. **Set Variables**: Update `dev_username` with your test username
4. **Test Endpoints**: All authenticated endpoints will work with dev headers

## 💡 Pro Tips

1. **Environment Variables**: Set up a "Development" environment in Postman with all your dev variables
2. **Header Presets**: Save the dev headers as a preset in Postman for quick application
3. **Duplicate Requests**: Copy endpoints and create "Dev" versions with headers pre-added
4. **Collection Variables**: Use collection-level variables for headers that apply to all requests

## 🔒 Security Note

- ✅ Development headers only work when `NODE_ENV=development`
- ✅ Automatically disabled in production
- ✅ Safe to leave in your collection - they're ignored in production

---

**Happy Testing! 🎉**

Need help? Check the main TESTING_GUIDE.md for more detailed instructions.
