# 火炮棋游戏 - 1Panel 服务器部署指南

## 目录

1. [项目概述](#项目概述)
2. [环境要求](#环境要求)
3. [部署准备](#部署准备)
4. [后端部署](#后端部署)
5. [前端部署](#前端部署)
6. [Nginx 反向代理配置](#nginx-反向代理配置)
7. [常见问题](#常见问题)

---

## 项目概述

火炮棋是一个在线策略对战游戏，包含两个部分：

- **前端** (cannon-game): Vue 3 + Vite 构建的SPA应用
- **后端** (cannon-server): Node.js + WebSocket 实时通信服务

## 环境要求

| 组件 | 版本要求 |
|------|----------|
| Node.js | >= 18.0.0 |
| npm | >= 8.0.0 |
| Nginx | >= 1.18 (反向代理) |

## 部署准备

### 1. 克隆项目到服务器

```bash
cd /www/wwwroot
git clone <你的仓库地址> cannon-antigravity
cd cannon-antigravity
```

### 2. 确认目录结构

```
cannon-antigravity/
├── cannon-game/        # 前端项目
├── cannon-server/      # 后端项目
└── 游戏规则.md
```

---

## 后端部署

### 1. 进入后端目录

```bash
cd /www/wwwroot/cannon-antigravity/cannon-server
```

### 2. 安装依赖

```bash
npm install
```

### 3. 创建环境配置

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器监听端口 (根据实际情况修改)
PORT=3000

# 心跳检测间隔 (毫秒)
HEARTBEAT_INTERVAL=30000
```

### 4. 编译 TypeScript

```bash
npm run build
```

### 5. 使用 PM2 管理进程

安装 PM2（如未安装）：

```bash
npm install -g pm2
```

创建 PM2 配置文件 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'cannon-server',
    script: 'dist/server.js',
    cwd: '/www/wwwroot/cannon-antigravity/cannon-server',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

启动服务：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

### 6. 验证后端服务

```bash
# 检查服务状态
pm2 status

# 查看日志
pm2 logs cannon-server
```

---

## 前端部署

### 1. 进入前端目录

```bash
cd /www/wwwroot/cannon-antigravity/cannon-game
```

### 2. 安装依赖

```bash
npm install
```

### 3. 创建生产环境配置

```bash
cp .env.example .env.production
```

编辑 `.env.production` 文件：

```env
# WebSocket 服务器地址
# 格式: ws://域名:端口 或 wss://域名/ws (如果使用HTTPS)
VITE_WS_URL=wss://your-domain.com/ws
```

> **重要提示**：
> - 如果使用 HTTPS，WebSocket 必须使用 `wss://` 协议
> - 如果使用 Nginx 反代，路径通常为 `/ws`

### 4. 构建生产版本

```bash
npm run build
```

构建完成后，静态文件位于 `dist/` 目录。

### 5. 配置 1Panel 网站

在 1Panel 中：

1. 进入 **网站** → **创建网站**
2. 选择 **静态网站**
3. 设置域名和根目录为 `/www/wwwroot/cannon-antigravity/cannon-game/dist`
4. 点击创建

---

## Nginx 反向代理配置

在 1Panel 的网站配置中，添加以下 Nginx 配置：

```nginx
# 在 server 块内添加

# WebSocket 代理
location /ws {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
}

# Vue Router History 模式支持
location / {
    try_files $uri $uri/ /index.html;
}
```

保存后点击 **重载配置**。

---

## 常见问题

### 1. WebSocket 连接失败

**检查项**：
- 确认后端服务正在运行：`pm2 status`
- 确认端口未被占用：`lsof -i:3000`
- 确认防火墙已开放端口
- 检查 Nginx 配置是否正确

### 2. 页面刷新后404

确保 Nginx 配置了 `try_files $uri $uri/ /index.html;`

### 3. 使用 HTTPS 但 WebSocket 连接失败

确保：
- `.env.production` 中使用 `wss://` 协议
- Nginx 配置了正确的 WebSocket 代理
- SSL 证书有效

### 4. 查看服务日志

```bash
# 后端日志
pm2 logs cannon-server

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```

---

## 更新部署

```bash
cd /www/wwwroot/cannon-antigravity

# 拉取最新代码
git pull

# 更新后端
cd cannon-server
npm install
npm run build
pm2 restart cannon-server

# 更新前端
cd ../cannon-game
npm install
npm run build
```

---

## 端口说明

| 服务 | 默认端口 | 说明 |
|------|----------|------|
| 前端 (Nginx) | 80/443 | 静态文件服务 |
| 后端 (WebSocket) | 3000 | 实时通信服务 |

---

部署完成后，访问你的域名即可开始游戏！🎮
