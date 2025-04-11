FROM node:18

WORKDIR /app/proxy-server

COPY proxy-server/package*.json ./
RUN npm install

COPY proxy-server/ ./

CMD ["node", "server.js"]
