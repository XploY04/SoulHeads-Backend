# SoulHeads - Sneakerhead Social Media Platform

SoulHeads is a social media platform built for sneaker enthusiasts to share, rate, and discuss their favorite sneakers.

## Features

- User authentication with Firebase
- Post sneaker photos with details
- Follow other sneaker enthusiasts
- Rate and review sneakers
- Browse trending sneakers
- Discover new releases
- Mobile-responsive design

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: Firebase Authentication
- **Image Storage**: Cloudinary
- **Containerization**: Docker
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## Prerequisites

- Node.js 14+
- MongoDB
- Firebase account
- Cloudinary account
- Docker and Docker Compose (for containerized deployment)

## Development Setup

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/SoulHeads.git
   cd SoulHeads
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

5. The API will be available at `http://localhost:5000`

## Environment Variables

```
# MongoDB Connection String
MONGO_URI=mongodb://username:password@localhost:27017/soulheads

# JWT Secret for token signing
JWT_SECRET=your-secret-key

# Upstash Redis Configuration
REDIS_URL=redis://username:password@localhost:6379

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (comma-separated for multiple domains)
ALLOWED_ORIGINS=https://yourfrontend.com

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with Firebase token

### Users

- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:id/follow` - Follow/unfollow user

### Posts

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Sneakers

- `GET /api/sneakers` - Get all sneakers
- `GET /api/sneakers/:id` - Get sneaker by ID
- `POST /api/sneakers/:id/rate` - Rate a sneaker
- `GET /api/sneakers/search` - Search sneakers

## Production Deployment

### Using Docker Compose

1. Build and start all services

   ```bash
   docker-compose up -d
   ```

2. For SSL setup with Let's Encrypt:

   ```bash
   # Set domain name and admin email
   export DOMAIN_NAME=soulheads.com
   export ADMIN_EMAIL=admin@soulheads.com

   # Start production profile with Certbot
   docker-compose --profile prod up -d
   ```

3. Verify services are running
   ```bash
   docker-compose ps
   ```

### Manual Deployment

1. Set environment to production

   ```bash
   export NODE_ENV=production
   ```

2. Install production dependencies

   ```bash
   npm ci --only=production
   ```

3. Start the server
   ```bash
   npm start
   ```

## Monitoring and Maintenance

- Logs are stored in the `logs/` directory
- Use `docker-compose logs -f` to follow container logs
- Monitor Redis cache with Upstash dashboard

## Security Considerations

- Always use HTTPS in production
- Store Firebase service account securely
- Never commit sensitive credentials to version control
- Update dependencies regularly with `npm audit fix`

## License

[MIT](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
