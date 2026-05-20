FROM node:20-alpine

WORKDIR /app

COPY dist/ ./dist/
COPY dist-card/ ./dist-card/
COPY server/ ./server/

WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
