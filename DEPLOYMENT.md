# 炮与兵棋游戏 - 1Panel 部署文档

## 📋 部署概述

本文档详细介绍如何将炮与兵棋游戏部署到1Panel管理的服务器上。游戏包含两个部分：
- **前端**：React应用（静态文件托管）
- **后端**：WebSocket服务器（Node.js应用）

## ⚡ 快速部署（推荐）

如果您希望快速部署，可以使用我们提供的自动化脚本：

### 1. 下载项目
```bash
# 克隆或下载项目到服务器
git clone <your-repository-url>
cd cannonweb
```

### 2. 一键部署
```bash
# 生产环境部署（推荐）
./deploy.sh -p

# 或开发环境部署（包含Redis和数据库）
./deploy.sh -d
```

### 3. 验证部署
```bash
# 运行部署检查
./check-deployment.sh

# 手动检查
curl http://localhost/health
```

### 4. 访问应用
- **游戏地址**：http://your-server-ip
- **健康检查**：http://your-server-ip/health

如果快速部署遇到问题，请继续阅读下方的详细部署步骤。

---

## 🛠 前置要求

### 服务器环境
- 已安装1Panel管理面板
- Ubuntu/CentOS/Debian等Linux系统
- 至少2GB内存，10GB存储空间
- 开放端口：80, 443, 3000, 8080

### 1Panel环境
- 1Panel版本 ≥ v1.8.0
- 已安装Docker
- 已安装Nginx（用于静态文件托管）
- 已安装Node.js运行时

## 🚀 部署步骤

### 第一步：准备项目文件

1. **打包前端应用**
```bash
# 在本地项目目录执行
cd cannonweb
npm install
npm run build
```

2. **准备服务器文件**
```bash
# 创建部署包
mkdir cannon-game-deploy
cp -r build/ cannon-game-deploy/frontend/
cp server.js cannon-game-deploy/backend/
cp package.json cannon-game-deploy/backend/
```

3. **上传到服务器**
```bash
# 使用scp上传（替换your-server-ip）
scp -r cannon-game-deploy/ root@your-server-ip:/opt/
```

### 第二步：在1Panel中配置前端

1. **创建网站**
   - 登录1Panel管理面板
   - 进入「网站」→「网站」
   - 点击「创建网站」
   - 网站类型：静态网站
   - 域名：`cannon-game.yourdomain.com`（或使用IP）
   - 网站目录：`/opt/cannon-game-deploy/frontend`

2. **配置Nginx**
   - 在网站设置中，进入「配置文件」
   - 添加以下配置：

```nginx
server {
    listen 80;
    server_name cannon-game.yourdomain.com;
    root /opt/cannon-game-deploy/frontend;
    index index.html index.htm;

    # 支持React Router的单页应用
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket代理到后端
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 安全头设置
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### 第三步：在1Panel中配置后端

1. **创建Node.js应用**
   - 进入「应用商店」→「已安装」
   - 找到Node.js，进入管理
   - 或者使用「容器」→「创建容器」

2. **使用Docker方式部署后端**
   - 进入「容器」→「镜像」
   - 创建自定义Dockerfile：

```dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json并安装依赖
COPY backend/package.json ./
RUN npm install --production

# 复制服务器文件
COPY backend/server.js ./

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["node", "server.js"]
```

3. **创建容器**
   - 容器名称：`cannon-game-backend`
   - 端口映射：`8080:8080`
   - 重启策略：`always`
   - 环境变量：
     ```
     NODE_ENV=production
     PORT=8080
     ```

### 第四步：配置SSL证书（可选）

1. **申请Let's Encrypt证书**
   - 在1Panel网站管理中
   - 进入「证书」→「申请证书」
   - 选择Let's Encrypt
   - 填写域名和邮箱

2. **配置HTTPS重定向**
```nginx
server {
    listen 443 ssl http2;
    server_name cannon-game.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # 其他配置保持不变...
}

server {
    listen 80;
    server_name cannon-game.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 第五步：防火墙配置

在1Panel安全设置中开放以下端口：
- **80**：HTTP访问
- **443**：HTTPS访问  
- **8080**：WebSocket服务

## ⚙️ 环境变量配置

### 后端环境变量
```bash
# 生产环境
NODE_ENV=production

# 服务端口
PORT=8080

# 跨域设置（如果需要）
CORS_ORIGIN=https://cannon-game.yourdomain.com

# 日志级别
LOG_LEVEL=info

# 数据库配置（如果使用）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cannon_game
DB_USER=cannon_user
DB_PASSWORD=your_secure_password

# Redis配置（如果使用）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### 前端环境变量（构建时）
```bash
# WebSocket服务器地址
REACT_APP_WS_URL=wss://cannon-game.yourdomain.com/ws

# API基础地址
REACT_APP_API_URL=https://cannon-game.yourdomain.com/api
```

## ✅ 部署验证

### 1. 自动验证脚本
```bash
# 使用提供的检查脚本
./check-deployment.sh
```

### 2. 手动验证步骤

**检查前端服务**
```bash
curl -I http://your-server-ip
# 应该返回 200 OK
```

**检查WebSocket服务**
```bash
# 检查端口监听
netstat -tlnp | grep 8080

# 测试WebSocket连接
wscat -c ws://your-server-ip:8080
```

**检查容器状态**
```bash
docker ps | grep cannon-game
docker logs cannon-game-backend
```

### 3. 功能验证
- 访问 `http://your-server-ip` 查看游戏界面
- 创建游戏房间测试联机功能
- 测试游戏规则和胜负判定
- 查看 `http://your-server-ip/status.html` 状态面板

## 📊 监控与维护

### 日志管理

**查看应用日志**
```bash
# 实时查看日志
./deploy.sh -l

# 查看容器日志
docker logs -f cannon-game-app

# 查看Nginx日志
docker exec cannon-game-app tail -f /var/log/nginx/access.log
```

**日志轮转配置**
```bash
# 在1Panel中配置日志轮转
# 或手动配置logrotate
```

### 性能监控

**资源使用情况**
```bash
# 查看容器资源使用
docker stats cannon-game-app

# 系统资源监控
htop
free -h
df -h
```

**连接数监控**
```bash
# WebSocket连接数
netstat -an | grep 8080 | grep ESTABLISHED | wc -l

# HTTP连接数
netstat -an | grep 80 | grep ESTABLISHED | wc -l
```

### 备份策略

**数据备份**
```bash
# 备份应用数据（如果有数据库）
docker exec cannon-game-db pg_dump -U cannon_user cannon_game > backup.sql

# 备份配置文件
tar -czf config-backup.tar.gz docker/ *.yml *.sh
```

**恢复数据**
```bash
# 恢复数据库
docker exec -i cannon-game-db psql -U cannon_user cannon_game < backup.sql
```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 容器启动失败
```bash
# 查看容器日志
docker logs cannon-game-app

# 检查镜像构建是否成功
docker images | grep cannon-game

# 重新构建镜像
./deploy.sh -c  # 清理
./deploy.sh -p  # 重新部署
```

#### 2. 前端无法访问
```bash
# 检查Nginx配置
docker exec cannon-game-app nginx -t

# 重新加载Nginx配置
docker exec cannon-game-app nginx -s reload

# 检查文件权限
docker exec cannon-game-app ls -la /var/www/html
```

#### 3. WebSocket连接失败
```bash
# 检查后端服务状态
docker exec cannon-game-app ps aux | grep node

# 检查端口监听
docker exec cannon-game-app netstat -tlnp | grep 8080

# 检查防火墙设置
ufw status
iptables -L
```

#### 4. 内存不足
```bash
# 清理无用的Docker镜像
docker system prune -a

# 调整容器内存限制
# 在docker-compose.yml中添加：
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

### 错误码对照表

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| 502 | 网关错误 | 检查后端服务是否运行 |
| 503 | 服务不可用 | 检查容器状态和资源 |
| 404 | 页面未找到 | 检查Nginx配置和文件路径 |
| CONNECTION_REFUSED | 连接被拒绝 | 检查端口和防火墙设置 |

## 🔄 更新部署

### 更新应用版本
```bash
# 1. 停止现有服务
./deploy.sh -s

# 2. 拉取最新代码
git pull origin main

# 3. 重新部署
./deploy.sh -p

# 4. 验证更新
./check-deployment.sh
```

### 零停机更新（高级）
```bash
# 使用蓝绿部署策略
# 1. 构建新版本镜像
docker build -t cannon-game:new .

# 2. 启动新容器（不同端口）
docker run -d --name cannon-game-new -p 8081:80 cannon-game:new

# 3. 测试新版本
curl http://localhost:8081/health

# 4. 切换流量（更新Nginx配置）
# 5. 停止旧容器
```

## 📞 技术支持

### 获取帮助
- **文档**: 查看本文档和README.md
- **日志**: 使用 `./check-deployment.sh` 诊断问题
- **社区**: 查看1Panel官方文档和社区
- **反馈**: 提交Issue到项目仓库

### 联系方式
- 1Panel官方文档: https://1panel.cn/docs/
- Docker文档: https://docs.docker.com/
- 项目仓库: 提交Issue获取支持

---

**部署完成后，您可以：**
- 🎮 访问 `http://your-server-ip` 开始游戏
- 📊 查看 `http://your-server-ip/status.html` 监控状态  
- 💚 访问 `http://your-server-ip/health` 检查健康状态

祝您部署愉快！🚀