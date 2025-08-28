# SoulHeads Backend Testing Guide

## 🔧 Development Testing Without Firebase Tokens

This guide provides multiple workarounds for testing the SoulHeads backend without requiring Firebase ID tokens during development.

**Note**: Redis caching has been removed from this backend. All cache operations are now no-ops for simplified deployment and development.

## 🚀 Quick Setup

1. **Set Environment to Development**

   ```bash
   NODE_ENV=development
   ```

2. **Start the server**
   ```bash
   npm run dev
   ```

## 🎯 Method 1: Development Header Bypass

### How it works:

Add special headers to bypass Firebase authentication in development mode.

### Headers to add:

```
x-dev-bypass: true
x-dev-username: your_test_username
```

### Example in Postman:

1. Add header: `x-dev-bypass` = `true`
2. Add header: `x-dev-username` = `testuser`
3. Make request to any protected endpoint

The system will automatically create a user if it doesn't exist.

## 🎯 Method 2: Development API Endpoints

### Available endpoints (development only):

#### 1. Create Test User

```http
POST /api/dev/create-user
Content-Type: application/json

{
  "username": "testuser123",
  "email": "test@dev.com"
}
```

#### 2. List All Users

```http
GET /api/dev/users
```

#### 3. Mock Login

```http
POST /api/dev/mock-login
Content-Type: application/json

{
  "username": "testuser123"
}
```

#### 4. Cleanup Test Data

```http
DELETE /api/dev/cleanup
```

## 🎯 Method 3: Using User ID Headers

If you know a user's MongoDB ObjectId:

### Headers:

```
x-dev-bypass: true
x-dev-user-id: 507f1f77bcf86cd799439011
```

## 📱 Testing Workflow

### Step 1: Create Test Users

```bash
# Using curl
curl -X POST http://localhost:5000/api/dev/create-user \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "alice@test.com"}'

curl -X POST http://localhost:5000/api/dev/create-user \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "email": "bob@test.com"}'
```

### Step 2: Test Authentication

```bash
# Test profile endpoint
curl -X GET http://localhost:5000/api/auth/profile \
  -H "x-dev-bypass: true" \
  -H "x-dev-username: alice"
```

### Step 3: Test Follow/Unfollow

```bash
# Get Bob's user ID first
curl -X GET http://localhost:5000/api/users/bob

# Alice follows Bob (replace BOB_USER_ID with actual ID)
curl -X POST http://localhost:5000/api/users/BOB_USER_ID/follow \
  -H "x-dev-bypass: true" \
  -H "x-dev-username: alice"
```

### Step 4: Test Posts

```bash
# Create a post as Alice
curl -X POST http://localhost:5000/api/posts \
  -H "x-dev-bypass: true" \
  -H "x-dev-username: alice" \
  -F "mainImage=@/path/to/image.jpg" \
  -F "brandName=Nike" \
  -F "sneakerName=Air Jordan 1" \
  -F "description=Test post"
```

## 🔒 Security Notes

- ⚠️ **Development routes are ONLY available when `NODE_ENV=development`**
- ⚠️ **These bypasses are automatically disabled in production**
- ⚠️ **Never use these methods with real Firebase tokens**

## 🧹 Cleanup

After testing, clean up test data:

```bash
curl -X DELETE http://localhost:5000/api/dev/cleanup
```

## 📋 Postman Collection Updates

The updated Postman collection includes:

1. **Development & Testing** folder with all dev endpoints
2. **Variables** for easy switching between users
3. **Example requests** with proper headers

### Key Variables:

- `dev_username`: Username for testing
- `dev_user_id`: User ID for testing
- `base_url`: Your server URL

### Example Headers in Postman:

```
x-dev-bypass: true
x-dev-username: {{dev_username}}
```

## 🐛 Troubleshooting

### "User not found" error:

- Make sure `x-dev-bypass: true` header is set
- Verify `NODE_ENV=development`
- Check username spelling

### "Development routes not available":

- Confirm `NODE_ENV=development` is set
- Restart the server after changing environment

### Database connection issues:

- Check MongoDB is running
- Verify MONGO_URI in .env file

## 🚀 Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production`
2. Remove all `x-dev-*` headers
3. Use real Firebase ID tokens
4. Verify dev routes are inaccessible

## 📞 Getting Real Firebase Tokens (Optional)

If you need to test with real Firebase tokens:

1. **Frontend Integration**: Use Firebase SDK in a simple HTML page
2. **Firebase Admin SDK**: Use service account to create custom tokens
3. **Firebase Auth Emulator**: Use Firebase emulator suite for local testing

### Quick Firebase Token Generator (HTML):

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js"></script>
  </head>
  <body>
    <button onclick="signIn()">Get Token</button>
    <div id="token"></div>

    <script>
      // Your Firebase config
      const firebaseConfig = {
        /* your config */
      };
      firebase.initializeApp(firebaseConfig);

      async function signIn() {
        try {
          const result = await firebase
            .auth()
            .signInWithEmailAndPassword("test@example.com", "password");
          const token = await result.user.getIdToken();
          document.getElementById("token").innerText = token;
        } catch (error) {
          console.error(error);
        }
      }
    </script>
  </body>
</html>
```

---

**Happy Testing! 🎉**
