# 炮与兵棋游戏

## 项目描述
这是一个基于React和TypeScript开发的6x6棋盘策略游戏，采用现代化的科技风UI设计。

## 最新更新 (UI优化)
- ✅ 游戏规则组件尺寸优化：宽度与棋盘精确匹配（404px）
- ✅ 布局对齐优化：游戏规则与左侧面板保持水平对齐
- ✅ 响应式设计：在小屏幕下自适应调整为垂直布局
- ✅ 视觉一致性：边框厚度、圆角、内边距与棋盘保持统一

## 🚀 超简单部署（推荐）

### 🎯 零基础用户 - 超级一键部署

专为完全不懂技术的用户设计，真正的一键搞定：

```bash
# 第1步：下载项目
git clone <repository-url> && cd cannonweb

# 第2步：运行超级一键部署（自动安装一切依赖）
./一键部署.sh
```

这个脚本会自动：
- ✅ 检查并安装Docker环境
- ✅ 检查并安装Docker Compose
- ✅ 构建游戏镜像
- ✅ 启动游戏服务
- ✅ 验证部署状态
- ✅ 显示访问地址

### 🎮 想要更多控制 - 交互式部署助手

如果您想自定义配置或了解部署过程：

```bash
# 运行交互式部署助手
./部署助手.sh
```

这个助手提供：
- 🎯 多种部署方式选择（1Panel/Docker/开发环境）
- ⚙️ 自定义域名和SSL证书配置
- 💾 自动备份选项
- 📊 实时状态检查
- 🔧 详细的配置预览和确认

### 🌐 立即访问
部署完成后：
- **游戏地址**: http://您的服务器IP
- **状态监控**: http://您的服务器IP/status.html

---

## 🚀 1Panel 一键部署（推荐）

### 🎯 超简单部署（3分钟）

专为1Panel用户设计的零配置部署方案：

```bash
# 第1步：下载项目到服务器
git clone <repository-url> && cd cannonweb

# 第2步：给脚本执行权限
chmod +x *.sh

# 第3步：一键部署
./deploy.sh -p

# 第4步：验证部署（专用1Panel检查工具）
./1panel-check.sh
```

### 🌐 立即访问
- **游戏地址**: http://您的服务器IP
- **状态监控**: http://您的服务器IP/status.html

### 📋 1Panel管理
部署完成后，您可以在1Panel中：
1. **容器管理**: 容器 → 容器 → `cannon-game-app`
2. **查看日志**: 点击容器名称 → 日志选项卡
3. **监控资源**: 查看CPU、内存使用情况
4. **重启服务**: 一键重启容器

### 🔧 高级配置（可选）

**通过1Panel网站功能访问：**
1. 创建反向代理网站：域名指向 `http://127.0.0.1:80`
2. 配置SSL证书：在1Panel中申请Let's Encrypt证书
3. 开放防火墙端口：80、443、8080

详细配置步骤请参考：[`1Panel部署快速指南.md`](./1Panel部署快速指南.md)

---

## 🚀 快速部署

### 方式一：1Panel 一键部署（推荐）

1. **准备环境**
   ```bash
   # 克隆项目
   git clone <repository-url>
   cd cannonweb
   
   # 确保1Panel已安装Docker和Docker Compose
   ```

2. **自动部署**
   ```bash
   # 生产环境部署
   ./deploy.sh -p
   
   # 开发环境部署（包含Redis和数据库）
   ./deploy.sh -d
   
   # 查看帮助
   ./deploy.sh -h
   ```

3. **访问应用**
   - 游戏地址：http://your-server-ip
   - 健康检查：http://your-server-ip/health

### 方式二：手动部署到1Panel

详细步骤请参考 [`DEPLOYMENT.md`](./DEPLOYMENT.md) 文件。

## 游戏规则
1. 🎯 大炮玩家操作2枚"大炮"棋子
2. ⚔️ 小兵玩家操作18枚"小兵"棋子  
3. 🎮 大炮玩家先手，轮流移动
4. 💥 大炮可以吃相隔一格的小兵
5. 🏆 小兵少于6个时，大炮玩家胜
6. 🛡️ 大炮无法移动时，小兵玩家胜
7. 🌐 支持联机对战，创建或加入房间

## 🛠 技术特点
- React + TypeScript
- 科技感毛玻璃UI设计
- WebSocket联机对战
- 完整的游戏逻辑和胜负判定
- 响应式设计
- 详细的中文代码注释
- Docker容器化部署
- Nginx反向代理
- 多进程管理（Supervisor）

## 📁 项目结构
```
cannonweb/
├── public/                   # 静态资源
├── src/                      # 源代码
│   ├── components/           # React组件
│   ├── styles/              # CSS样式文件
│   └── ...
├── docker/                   # Docker配置文件
│   ├── nginx.conf           # Nginx主配置
│   ├── default.conf         # 站点配置
│   └── supervisord.conf     # 进程管理配置
├── server.js                 # WebSocket服务器
├── Dockerfile               # Docker镜像构建文件
├── docker-compose.yml       # Docker Compose配置
├── deploy.sh                # 自动化部署脚本
├── DEPLOYMENT.md            # 详细部署文档
└── README.md                # 项目说明
```

## 🔧 本地开发

### 开发模式运行
```bash
npm install
npm start                    # 启动前端开发服务器
npm run server              # 启动WebSocket服务器
npm run dev                  # 同时启动前端和后端
```

### 构建生产版本
```bash
npm run build               # 构建前端
```

## 🐳 Docker部署

### 使用Docker Compose
```bash
# 生产环境
docker-compose up -d cannon-game

# 开发环境（包含Redis和数据库）
docker-compose --profile redis --profile database up -d

# 查看日志
docker-compose logs -f cannon-game

# 停止服务
docker-compose down
```

### 手动Docker部署
```bash
# 构建镜像
docker build -t cannon-game .

# 运行容器
docker run -d \
  --name cannon-game-app \
  -p 80:80 \
  -p 8080:8080 \
  cannon-game
```

## 🌐 生产环境配置

### Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
    }
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### SSL证书配置
```bash
# 在1Panel中申请Let's Encrypt证书
# 或使用自有证书配置HTTPS
```

## 📊 监控与维护

### 日志查看
```bash
# 应用日志
./deploy.sh -l

# Nginx日志
docker exec cannon-game-app tail -f /var/log/nginx/access.log

# WebSocket日志
docker exec cannon-game-app tail -f /app/logs/websocket.log
```

### 健康检查
```bash
# 检查服务状态
curl http://localhost/health

# 检查容器状态
docker ps | grep cannon-game
```

### 性能监控
- CPU和内存使用情况
- 网络连接数
- WebSocket连接状态
- 游戏房间数量

## 🚨 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 查看容器日志
   docker logs cannon-game-app
   
   # 检查端口占用
   netstat -tlnp | grep -E '80|8080'
   ```

2. **WebSocket连接失败**
   ```bash
   # 检查防火墙设置
   # 确保8080端口开放
   
   # 检查代理配置
   nginx -t
   ```

3. **前端页面无法访问**
   ```bash
   # 检查Nginx状态
   docker exec cannon-game-app nginx -s reload
   
   # 检查文件权限
   docker exec cannon-game-app ls -la /var/www/html
   ```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 技术支持

- **项目文档**：查看本README和DEPLOYMENT.md
- **1Panel文档**：https://1panel.cn/docs/
- **Docker文档**：https://docs.docker.com/
- **问题反馈**：提交到项目Issue

## 🎉 特别感谢

感谢以下技术栈的支持：
- React & TypeScript
- WebSocket
- Docker & Docker Compose
- Nginx
- 1Panel

---

享受您的在线对战炮与兵棋游戏吧！🎮✨
