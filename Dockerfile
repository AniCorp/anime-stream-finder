# Builder stage
FROM apify/actor-node-playwright-chrome:20 AS builder
WORKDIR /usr/src/app

# Copy package files with proper ownership
COPY --chown=node:node package*.json ./

# Switch to the node user (if not already set by the base image)
USER node

# Install dependencies as node user
RUN npm install --include=dev --audit=false

# Copy the rest of the source files with proper ownership and build
COPY --chown=node:node . ./
RUN npm run build

# Final stage
FROM apify/actor-node:20
WORKDIR /usr/src/app

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package files (ownership can be set here too if needed)
COPY --chown=node:node package*.json ./

# Install production dependencies
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Copy the rest of the source files with proper ownership
COPY --chown=node:node . ./

# Run the application
CMD ["npm", "run", "start:prod", "--silent"]
