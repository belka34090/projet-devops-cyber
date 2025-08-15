FROM node:18-alpine

# Ajoute wget (nécessaire au healthcheck)
RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "API_Node.js"]

