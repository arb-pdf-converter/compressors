FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    ghostscript \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install

RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 10000
CMD ["npm", "start"]
