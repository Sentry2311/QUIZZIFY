# Single-origin production image: nginx serves the built SPA and proxies
# /api + /socket.io to the API running in the same container.
# syntax=docker/dockerfile:1

FROM node:22-alpine AS client-build
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS server-deps
WORKDIR /srv
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
# nginx in the same image so the app is reachable on one origin and one port.
RUN apk add --no-cache nginx \
    && mkdir -p /run/nginx /var/lib/nginx/tmp /var/log/nginx \
    && chown -R nginx:nginx /run/nginx /var/lib/nginx /var/log/nginx

WORKDIR /app
ENV NODE_ENV=production
COPY --from=server-deps /srv/node_modules ./node_modules
COPY server/package*.json ./
COPY server/src ./src
COPY --from=client-build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf.template /etc/nginx/quizzify.conf.template
COPY deploy/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["/usr/local/bin/start.sh"]
