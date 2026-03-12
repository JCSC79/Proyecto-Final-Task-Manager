# Use the official Node 24 Alpine image for a lightweight and secure environment
FROM node:24-alpine3.23

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package management files to leverage Docker layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the application in development mode using tsx
CMD ["npm", "run", "dev"]