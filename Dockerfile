FROM node:18-alpine as base

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001 -G nodejs

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Remove development files and service account file in production
RUN if [ "$NODE_ENV" = "production" ] ; then \
        rm -f soulheads-firebase-adminsdk-fbsvc-62da09beab.json; \
    fi

# Create logs directory with proper permissions
RUN mkdir -p logs \
    && chown -R nodeuser:nodejs logs

# Set permissions
RUN chown -R nodeuser:nodejs /app

# Use the non-root user
USER nodeuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]