# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
# 1️⃣ copy and install only what's needed to build
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts
# 2️⃣ copy sources and compile
COPY . .
RUN npm run build                # → dist/
# ---------- runtime stage ----------
# Use a tiny, non-root Node base image
FROM gcr.io/distroless/nodejs20-debian11 AS runtime
WORKDIR /app
# 3️⃣ copy production node_modules + compiled JS
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
# 4️⃣ set an unprivileged user already present in distroless images
USER nonroot
EXPOSE 3000
ENV NODE_ENV=production PORT=3000
CMD ["dist/app.js"]
