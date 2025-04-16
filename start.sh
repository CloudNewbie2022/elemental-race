#!/bin/bash

echo "📦 Starting Docker containers..."
docker-compose up --build -d

# Wait a few seconds for nginx to boot
sleep 5

echo "🌐 Opening http://localhost:3000..."
if which xdg-open > /dev/null; then
  xdg-open http://localhost:3000
elif which open > /dev/null; then
  open http://localhost:3000
else
  echo "Please open http://localhost:3000 in your browser."
fi
