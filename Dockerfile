# Dockerfile
FROM node:18
WORKDIR /app
COPY proxy-server/package*.json ./
RUN npm install
COPY proxy-server/ .
EXPOSE 8080
CMD ["node", "index.js"]
