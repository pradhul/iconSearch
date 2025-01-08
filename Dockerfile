# Dockerfile
# Build stage
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy package files for installation
COPY package*.json ./
COPY webpack.config.js ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code and required files
COPY src/ ./src/
COPY models/ ./models/
COPY iconData.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models
COPY --from=builder /app/iconData.json ./
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]