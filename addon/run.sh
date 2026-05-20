#!/usr/bin/with-contenv bashio

# Ensure output directory exists
mkdir -p /config/www/floorplan-editor

# Start the Node.js backend/proxy server
exec node /app/server/index.js
