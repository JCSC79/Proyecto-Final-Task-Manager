# Stage 1: Build
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies - we use legacy-peer-deps for Blueprint compatibility
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine
# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the static files from the build stage to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Port for the web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]