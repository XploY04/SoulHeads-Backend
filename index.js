const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { initializeFirebaseAdmin } = require("./config/firebaseAdmin");
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

// Basic security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Request body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Simple request logging
app.use(morgan("dev"));

// Define routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/sneakers", require("./routes/sneakers"));

// Default route
app.get("/", (req, res) => {
  res.send("SoulHeads API is running");
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Error handler
app.use(handleError);

// Define port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Basic shutdown handler
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
  });
});
