# Build stage
FROM node:22.14.0 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --package-lock-only && npm ci
COPY . .

# Runtime stage
FROM node:22.14.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=develop
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "dev"]
