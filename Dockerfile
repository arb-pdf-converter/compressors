FROM node:20-bullseye

WORKDIR /app

# Install Ghostscript
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app
COPY . .

# Create uploads folder
RUN mkdir -p /app/uploads

# Render uses PORT dynamically
ENV PORT=10000

EXPOSE 10000

CMD ["npm", "start"]
