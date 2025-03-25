# Builder stage
FROM apify/actor-node-playwright-chrome:20 AS builder
WORKDIR /usr/src/app

# Copy package files and update ownership to the 'node' user
COPY package*.json ./
RUN chown -R node:node /usr/src/app

# Switch to the 'node' user to avoid permission issues
USER node

# Install dependencies as node user
RUN npm install --include=dev --audit=false

# Copy the rest of the source files (ensure files are owned by node)
COPY --chown=node:node . ./
RUN npm run build

# Final stage
FROM apify/actor-node:20
WORKDIR /usr/src/app

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package files for caching; ownership is preserved via COPY (or adjust if needed)
COPY package*.json ./

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
