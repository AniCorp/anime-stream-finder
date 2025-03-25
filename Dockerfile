# Builder stage
FROM apify/actor-node-playwright-chrome:20 AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# (Optional) Adjust permissions if necessary
# RUN chown -R node:node /usr/src/app

# Install dependencies
RUN npm install --include=dev --audit=false

# Copy the rest of the source files and build the project
COPY . ./
RUN npm run build

# Final stage
FROM apify/actor-node:20
WORKDIR /usr/src/app

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package files again
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

# Copy remaining source files
COPY . ./

# Run the application
CMD ["npm", "run", "start:prod", "--silent"]
