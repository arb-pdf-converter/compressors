# Multi-stage build 
FROM node:20-alpine AS builder 
WORKDIR /app 
COPY package*.json ./ 
RUN npm ci --only=production 
# Production image with Ghostscript 
FROM ubuntu:22.04 
# Install Ghostscript + Node 
RUN apt-get update && apt-get install -y \ 
              ghostscript \ 
              nodejs \ 
              npm \ 
              && rm -rf /var/lib/apt/lists/* 

WORKDIR /app 
COPY --from=builder /app/node_modules ./node_modules 
COPY . . 
# Create uploads dir 
RUN mkdir -p /app/uploads && chmod 777 /app/uploads 
EXPOSE 10000 CMD ["npm", "start"]
