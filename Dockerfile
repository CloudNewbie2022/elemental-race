FROM node:18

# Set working directory to the root of your project
WORKDIR /app

# Copy package.json and package-lock.json from the root
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

RUN ls -R /app
# Expose the port the app runs on

# Run the app
CMD ["npm", "start"]
