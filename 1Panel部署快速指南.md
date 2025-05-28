# 🎮 炮与兵棋游戏 - 1Panel快速部署指南

## 📋 快速开始（5分钟部署）

这是专为1Panel用户准备的超简单部署指南，让您在5分钟内完成游戏部署！

### 🎯 一键部署命令

```bash
# 第1步：下载项目
git clone <your-repository-url> && cd cannonweb

# 第2步：给脚本执行权限
chmod +x deploy.sh check-deployment.sh

# 第3步：一键部署
./deploy.sh -p

# 第4步：验证部署
./check-deployment.sh
```

### 🌐 访问游戏
部署完成后立即访问：
- **游戏地址**: http://您的服务器IP
- **状态监控**: http://您的服务器IP/status.html

---

## 🏗️ 详细部署步骤

### 步骤1：准备1Panel环境

**确保1Panel已安装以下应用：**
- ✅ Docker & Docker Compose
- ✅ Nginx（可选，容器内已包含）

**在1Panel应用商店中安装：**
1. 进入「应用商店」
2. 搜索并安装「Docker」
3. 搜索并安装「Docker Compose」

### 步骤2：准备项目文件

**方式A：直接在服务器上操作**
```bash
# SSH连接到服务器
ssh root@your-server-ip

# 下载项目
git clone <your-repository-url>
cd cannonweb

# 给脚本执行权限
chmod +x *.sh
```

**方式B：本地上传**
```bash
# 在本地打包项目
tar -czf cannonweb.tar.gz cannonweb/

# 上传到服务器
scp cannonweb.tar.gz root@your-server-ip:/opt/

# 在服务器上解压
ssh root@your-server-ip
cd /opt && tar -xzf cannonweb.tar.gz
cd cannonweb && chmod +x *.sh
```

### 步骤3：执行自动部署

```bash
# 生产环境部署（推荐）
./deploy.sh -p

# 查看部署过程日志
./deploy.sh -l
```

**部署过程说明：**
1. 🔍 检查Docker环境
2. 🏗️ 构建游戏镜像
3. 🚀 启动容器服务
4. ✅ 执行健康检查

### 步骤4：在1Panel中管理

**容器管理：**
1. 登录1Panel面板
2. 进入「容器」→「容器」
3. 查看 `cannon-game-app` 容器状态

**日志查看：**
1. 点击容器名称
2. 进入「日志」选项卡
3. 实时查看运行日志

**资源监控：**
1. 在容器详情页查看CPU/内存使用
2. 监控网络流量和连接数

---

## 🔧 1Panel专属配置

### 网站代理配置（可选）

如果您想通过1Panel的网站功能访问游戏：

1. **创建网站**
   - 进入「网站」→「网站」
   - 点击「创建网站」
   - 选择「反向代理」
   - 域名：`cannon-game.yourdomain.com`
   - 代理地址：`http://127.0.0.1:80`

2. **配置代理规则**
```nginx
# 游戏主页
location / {
    proxy_pass http://127.0.0.1:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# WebSocket代理
location /ws {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### SSL证书配置

1. **在1Panel中申请证书**
   - 进入「网站」→「证书」
   - 点击「申请证书」
   - 选择「Let's Encrypt」
   - 填写域名信息

2. **绑定证书到网站**
   - 编辑创建的网站
   - 在「HTTPS」选项卡中
   - 选择申请的证书
   - 开启「强制HTTPS」

### 防火墙设置

在1Panel中开放必要端口：
1. 进入「安全」→「防火墙」
2. 添加规则：
   - 端口 `80`：HTTP访问
   - 端口 `443`：HTTPS访问
   - 端口 `8080`：WebSocket服务

---

## 🚨 常见问题快速解决

### Q1: 容器启动失败
```bash
# 查看详细错误
docker logs cannon-game-app

# 重新部署
./deploy.sh -c  # 清理
./deploy.sh -p  # 重新部署
```

### Q2: 无法访问游戏页面
```bash
# 检查端口占用
netstat -tlnp | grep -E "80|8080"

# 检查容器状态
docker ps | grep cannon-game

# 重启容器
docker restart cannon-game-app
```

### Q3: WebSocket连接失败
1. 检查防火墙是否开放8080端口
2. 确认容器内服务正常运行：
   ```bash
   docker exec cannon-game-app ps aux
   ```

### Q4: 在1Panel中看不到容器
```bash
# 手动启动容器（如果自动部署失败）
docker-compose up -d cannon-game

# 检查docker-compose服务
docker-compose ps
```

---

## 📊 部署验证清单

使用自动检查脚本：
```bash
./check-deployment.sh
```

**手动验证清单：**
- [ ] 容器正常运行：`docker ps | grep cannon-game`
- [ ] HTTP服务正常：`curl http://localhost/health`
- [ ] WebSocket端口监听：`netstat -tlnp | grep 8080`
- [ ] 游戏页面可访问：浏览器打开 `http://服务器IP`
- [ ] 状态页面可访问：浏览器打开 `http://服务器IP/status.html`

---

## 🔄 日常维护命令

```bash
# 查看实时日志
./deploy.sh -l

# 重启服务
docker restart cannon-game-app

# 更新部署
git pull && ./deploy.sh -p

# 备份数据
docker exec cannon-game-app tar -czf /tmp/backup.tar.gz /app/logs

# 清理环境
./deploy.sh -c
```

---

## 📞 技术支持

**遇到问题？按以下顺序排查：**

1. **运行检查脚本**：`./check-deployment.sh`
2. **查看容器日志**：`docker logs cannon-game-app`
3. **检查1Panel日志**：在1Panel界面查看系统日志
4. **查看项目文档**：阅读完整的 `DEPLOYMENT.md`

**获取帮助：**
- 📖 1Panel官方文档：https://1panel.cn/docs/
- 🐳 Docker教程：https://docs.docker.com/get-started/
- 💬 提交Issue：在项目仓库中反馈问题

---

**🎉 部署成功！现在您可以享受在线对战炮与兵棋游戏了！**

游戏特色：
- 🎯 经典6x6棋盘策略游戏
- 👥 支持联机对战
- 🎨 现代科技风UI设计
- 📱 响应式设计，支持移动设备
- 🚀 一键部署，零配置启动 