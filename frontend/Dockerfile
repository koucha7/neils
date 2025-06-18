# MomoNail/frontend/Dockerfile
# Viteビルド用ステージ
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

COPY . .

# VITE_API_BASE_URL をビルド時に設定 (本番用)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Nginxで静的ファイルを配信するステージ
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx設定 (必要であればカスタマイズ)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]