# ===== Stage 1: Build the React app =====
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ===== Stage 2: Production server =====
FROM nginx:1.31-alpine

# OCI Image Labels
LABEL org.opencontainers.image.title="Bouguedima Studio Frontend" \
      org.opencontainers.image.description="React SPA served by Nginx" \
      org.opencontainers.image.vendor="Bouguedima Studio" \
      org.opencontainers.image.source="https://github.com/bouguedima/studio"

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create temp directories for nginx
RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R app:app /var/cache/nginx /var/run /usr/share/nginx/html && \
    touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
