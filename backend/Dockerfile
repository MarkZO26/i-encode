# 1. Gamit tayo ng Node image
FROM node:18-alpine

# 2. Set ang folder sa loob ng Docker
WORKDIR /app

# 3. I-copy ang package files para ma-install ang dependencies
COPY package*.json ./

# 4. I-install ang mga libraries (Dito maiinstall ang bcryptjs)
RUN npm install

# 5. I-copy ang lahat ng code mo (index.js, .env, etc.)
COPY . .

# 6. Buksan ang port 5000
EXPOSE 5000

# 7. Patakbuhin ang server
CMD ["node", "index.js"]