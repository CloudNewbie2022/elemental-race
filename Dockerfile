# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy only package.json and lock for caching
COPY proxy-server/package*.json ./

# Install deps (this is where express gets installed)
RUN npm install

# Copy all other server files
COPY proxy-server/ ./

# Start your server
CMD ["node", "server.js"]
