
# Base image
FROM node:26-alpine

# Put the application in /app
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

# Configure application port
ENV PORT=8080

# Document the port
EXPOSE 8080

# Run as non-root user
USER node

# Start the application
CMD ["npm", "start"]
