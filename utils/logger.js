// filepath: c:\Users\YASH\Documents\Github\SoulHeads\utils\logger.js
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Create logs directory if it doesn't exist
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define which transports to use based on environment
const transports = [
  // Write all logs with level 'error' and below to 'error.log'
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Write all logs with level 'info' and below to 'combined.log'
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add console transport in development mode
if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "soulheads-api" },
  transports,
});

// Extend logger to add request logging capability
logger.logRequest = (req, res, responseTime) => {
  if (process.env.NODE_ENV === "production") {
    logger.info({
      type: "request",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: req.user ? req.user._id : "guest",
    });
  }
};

module.exports = logger;
