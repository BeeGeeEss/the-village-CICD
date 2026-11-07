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
ARG PORT=3000
ENV PORT=${PORT}

# Document the port
EXPOSE ${PORT}

# Run as non-root user
USER node

# Start the application
CMD ["npm", "start"]