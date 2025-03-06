# Base on Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client BEFORE building Next.js
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Expose the port used by the application
EXPOSE 3000

# Start the application
CMD ["npm", "start"]