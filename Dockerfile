# Use Node.js LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Expo dev server port
EXPOSE 19000 19001 19002

# Start Expo
CMD ["npx", "expo", "start", "--tunnel"]