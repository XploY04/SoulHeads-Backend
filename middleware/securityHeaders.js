// filepath: c:\Users\YASH\Documents\Github\SoulHeads\middleware\securityHeaders.js
/**
 * Custom security headers middleware with more granular control than helmet
 */
const setSecurityHeaders = (req, res, next) => {
  // Content Security Policy
  if (process.env.NODE_ENV === "production") {
    // Strict CSP for production environment
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com; " +
        "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; " +
        "img-src 'self' https://res.cloudinary.com data: blob:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
        "media-src 'self'; " +
        "object-src 'none'; " +
        "frame-ancestors 'none'; " +
        "form-action 'self'; " +
        "base-uri 'self'; " +
        "upgrade-insecure-requests;"
    );
  } else {
    // Relaxed CSP for development environment
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: *; " +
        "connect-src 'self' *; " +
        "font-src 'self' *; " +
        "object-src 'none';"
    );
  }

  // Additional security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Feature-Policy (deprecated but still supported by some browsers)
  res.setHeader(
    "Feature-Policy",
    "camera none; microphone none; geolocation none"
  );

  next();
};

module.exports = setSecurityHeaders;
