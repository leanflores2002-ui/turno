# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS serve

# SPA routing (default) and template that binds to $PORT at runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /nginx.conf.template

# Generate env.js on container start using $API_BASE_URL
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh || true

# Static build output
COPY --from=build /app/dist/turnoplus/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
