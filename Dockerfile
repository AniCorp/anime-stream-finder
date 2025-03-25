# Specify the base Docker image and name the build stage as "builder"
FROM apify/actor-node-playwright-chrome:20 AS builder

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package*.json ./

# Install all dependencies. Don't audit to speed up the installation.
RUN npm install --include=dev --audit=false

# Copy the source files using the user set in the base image.
COPY . ./

# Build the project.
RUN npm run build

# Create final image from a different base image.
FROM apify/actor-node:20

# Copy only built JS files from builder image
COPY --from=builder /usr/src/app/dist ./dist

# Copy just package.json and package-lock.json for caching.
COPY package*.json ./

# Install NPM packages, skipping dev and optional dependencies.
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Copy the remaining files and directories.
COPY . ./

# Run the image.
CMD npm run start:prod --silent
