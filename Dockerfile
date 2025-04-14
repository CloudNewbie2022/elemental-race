FROM node:18

# Set working directory to the root of your project
WORKDIR /app

# Copy package.json and package-lock.json from the root
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Run the app
CMD ["npm", "start"]
