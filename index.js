const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const compression = require("compression");
const connectDB = require("./config/db");
const { initializeFirebaseAdmin } = require("./config/firebaseAdmin");
const rateLimiter = require("./middleware/rateLimiter");
const securityHeaders = require("./middleware/securityHeaders");
const path = require("path");
const morgan = require("morgan");
const logger = require("./utils/logger");
const { handleError } = require("./utils/errorHandler");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Initialize Express app
const app = express();

// Enhanced security headers from helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // We use our custom CSP implementation
    crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources to be shared across origins for API server
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Apply custom security headers including CSP
app.use(securityHeaders);

// Compression middleware (must be before other middleware that sends responses)
app.use(compression());

// Enable CORS with specific options
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(",")
          : true
        : true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours in seconds
  })
);

// Increase payload size limit for image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Response time tracking middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    logger.logRequest(req, res, elapsedTimeInMs.toFixed(3));
  });

  next();
});

// Request logging with morgan - streaming to winston in production
if (process.env.NODE_ENV === "production") {
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
} else {
  app.use(morgan("dev")); // Simpler logs in development
}

// Apply rate limiters to specific routes
app.use("/api/auth", rateLimiter.auth()); // More strict for auth endpoints
app.use("/api/sneakers/search", rateLimiter.search()); // Less strict for search
app.use("/api", rateLimiter.standard()); // Standard for other API endpoints

// Define routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/sneakers", require("./routes/sneakers"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder with cache control
  app.use(
    express.static("client/build", {
      maxAge: "30d",
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          // No cache for HTML files
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
} else {
  // Default route for non-production
  app.get("/", (req, res) => {
    res.send("SoulHeads API is running in development mode");
  });
}

// 404 handler for undefined routes
app.use("*", (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Global error handler
app.use(handleError);

// Define port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });

  // Exit with error after ensuring logs are written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
