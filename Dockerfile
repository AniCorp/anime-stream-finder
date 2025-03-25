# Builder stage
FROM apify/actor-node-playwright-chrome:20 AS builder-stage
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

# Install system dependency for sharp and build dependencies (using Alpine's apk)
USER root
RUN apk update && apk add --no-cache vips-dev
RUN apk add --no-cache --virtual .build-deps make gcc g++ python3

# Ensure the entire working directory is owned by node
RUN chown -R node:node /usr/src/app

# Switch to node user for application setup
USER node
# Copy built files and package files from the builder stage with correct ownership
COPY --from=builder-stage /usr/src/app/dist ./dist
COPY --chown=node:node package*.json ./

# Install production dependencies (omitting dev and optional)
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Switch to root to remove the build dependencies
USER root
RUN apk del .build-deps

# Switch back to node for the remaining operations
USER node
COPY --chown=node:node . ./

# Run the application
CMD ["npm", "run", "start:prod", "--silent"]
