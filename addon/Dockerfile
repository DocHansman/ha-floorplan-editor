ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base-nodejs:20
FROM $BUILD_FROM

WORKDIR /app

# Copy built frontend assets
COPY src/dist/ ./dist/

# Copy card bundle (published to /config/www/ on demand via the Publish button)
COPY ../card/dist/ ./dist-card/

# Copy server files
COPY server/ ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
