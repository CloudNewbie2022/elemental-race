FROM node:18

WORKDIR /app
COPY proxy-server/package*.json ./
RUN npm install

COPY proxy-server/ ./

CMD ["node", "server.js"]
