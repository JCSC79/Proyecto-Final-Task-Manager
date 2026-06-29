# Use the official Node 24 Alpine image for a lightweight and secure environment
FROM node:24-alpine3.23

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package management files to leverage Docker layer caching
COPY --chown=node:node package*.json ./

# Install project dependencies
RUN npm install

# Copy only the required source files (avoids accidentally including sensitive data)
COPY --chown=node:node src/ ./src/
COPY --chown=node:node knexfile.cjs tsconfig.json ./

# Expose the API port
EXPOSE 3000

# Run as non-root user for security
USER node

# Start the application in development mode using tsx
CMD ["npm", "run", "dev"]