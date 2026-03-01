# FreshCart — Single-stage image
# The Next.js build runs at container start (after MongoDB is healthy)
# so API routes can resolve the DB connection during static analysis.

FROM node:20-alpine
WORKDIR /app

# Install all dependencies (devDeps included — ts-node is needed for seeding)
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 3000

# build → seed (idempotent) → start
# docker-compose overrides this with the same pattern after MongoDB is healthy
CMD ["sh", "-c", "npm run build && npm run seed && npm start"]
