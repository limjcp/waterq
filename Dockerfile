# Base on Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Add wait-for-it script to ensure database is ready before starting
RUN apk add --no-cache bash
COPY --chmod=+x ./scripts/wait-for-it.sh /wait-for-it.sh

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Expose the port used by the application
EXPOSE 3000

# Start the application with wait-for-it
CMD ["/bin/bash", "-c", "/wait-for-it.sh waterq:5432 -- npm start"]