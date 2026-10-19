FROM node:22.22.2-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ git ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY client/package.json client/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/data-provider/package.json packages/data-provider/package.json
COPY packages/data-schemas/package.json packages/data-schemas/package.json
RUN npm ci --no-audit --no-fund
FROM dependencies AS build
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=6144
RUN npm run frontend
FROM node:22.22.2-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3080
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app /app
RUN mkdir -p logs uploads client/public/images && chown -R node:node logs uploads client/public
USER node
EXPOSE 3080
CMD ["npm", "run", "backend"]
