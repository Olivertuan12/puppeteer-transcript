# Base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy files
COPY . .

# Install deps with legacy peer support
RUN npm install --legacy-peer-deps

# Expose port
EXPOSE 3000

# Start app
CMD [ "npm", "start" ]
