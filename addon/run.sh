#!/bin/sh
mkdir -p /config/www/floorplan-editor
export SERVER_PORT=8099
exec node /app/server/index.js
