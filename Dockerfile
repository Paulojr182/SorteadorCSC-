# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Required for better-sqlite3 compilation if binary fails
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Expose correct port
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["npm", "start"]
