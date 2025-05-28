# 多阶段构建：第一阶段构建前端
FROM node:18-alpine AS build-frontend

# 设置工作目录
WORKDIR /app

# 复制前端依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制前端源代码
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./

# 构建前端应用
RUN npm run build

# 第二阶段：构建后端和最终镜像
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    nginx \
    supervisor \
    && rm -rf /var/cache/apk/*

# 创建应用目录
WORKDIR /app

# 复制后端文件
COPY server.js ./
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从第一阶段复制构建好的前端文件
COPY --from=build-frontend /app/build /var/www/html

# 复制Nginx配置
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# 复制supervisor配置
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx /var/log/supervisor /app/logs

# 设置权限
RUN chown -R nginx:nginx /var/www/html && \
    chown -R nobody:nobody /app

# 暴露端口
EXPOSE 80 8080

# 启动supervisor管理多个进程
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 