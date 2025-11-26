FROM node:18-alpine

WORKDIR /app

# Install dependencies for Expo
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .

# Expose Expo default ports
EXPOSE 8081 19000 19001 19002

# Start Expo dev server on all interfaces
CMD ["npm", "run", "start:docker"]

