# Builder stage
FROM apify/actor-node-playwright-chrome:20 AS builder
WORKDIR /usr/src/app

# Copy package files with proper ownership
COPY --chown=node:node package*.json ./

# Pre-create node_modules directory with proper permissions
USER root
RUN mkdir -p /usr/src/app/node_modules && chown -R node:node /usr/src/app/node_modules

# Switch to node user for installation
USER node
RUN npm install --include=dev --audit=false

# Copy the rest of the source files and build the project
COPY --chown=node:node . ./
RUN npm run build

# Final stage
FROM apify/actor-node:20
WORKDIR /usr/src/app

# Install system dependency for sharp using apk (Alpine Linux package manager)
USER root
RUN apk update && apk add --no-cache vips-dev

# Switch back to node for subsequent operations
USER node

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package files with proper ownership
COPY --chown=node:node package*.json ./

# Install production dependencies (omitting dev and optional packages)
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Copy remaining source files with proper ownership
COPY --chown=node:node . ./

# Run the application
CMD ["npm", "run", "start:prod", "--silent"]
