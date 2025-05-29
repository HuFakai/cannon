# 🎮 炮与兵棋游戏 - 1Panel服务器部署指南

## 🚨 重要端口说明

**为避免端口冲突，本游戏已将默认端口修改为：**
- **HTTP服务端口**: 3000 (原80端口)
- **WebSocket端口**: 8080 (保持不变)

如果这些端口仍有冲突，请参考：`端口修改指南.md`

## 🚨 常见问题解决

### 问题1: `git: command not found`

这是因为服务器还没有安装git。请按以下步骤操作：

## 📋 完整部署步骤

### 步骤1: 安装git

在1Panel终端中执行以下命令（根据您的系统选择）：

```bash
# CentOS/RHEL/AlmaLinux/Rocky Linux
yum install -y git

# Ubuntu/Debian
apt update && apt install -y git

# 验证git安装成功
git --version
```

### 步骤2: 下载项目

```bash
# 下载项目到服务器
git clone https://github.com/HuFakai/cannon.git

# 进入项目目录
cd cannon

# 给所有脚本执行权限
chmod +x *.sh
```

### 步骤3: 选择部署方式

#### 🥇 推荐方式1: 1Panel专用部署
```bash
./deploy.sh -p
```

#### 🥈 推荐方式2: 超级一键部署
```bash
./一键部署.sh
```

#### 🥉 推荐方式3: 交互式助手
```bash
./部署助手.sh
```

### 步骤4: 配置1Panel防火墙

⚠️ **重要**: 需要在1Panel中开放端口3000和8080

1. 登录1Panel管理面板
2. 进入「安全」→「防火墙」  
3. 添加以下规则：
   - **端口3000** (HTTP服务): TCP协议，允许策略
   - **端口8080** (WebSocket): TCP协议，允许策略

### 步骤5: 验证部署

```bash
# 运行1Panel专用检查工具
./1panel-check.sh

# 或者手动检查
curl http://localhost:3000/health

# 获取服务器IP并测试访问
SERVER_IP=$(curl -s ipinfo.io/ip)
echo "游戏地址: http://$SERVER_IP:3000"
```

---

## 🌐 方案2: 1Panel文件管理器部署（无需git）

如果不想安装git，可以通过1Panel的文件管理器部署：

### 2.1 下载项目压缩包

1. 在浏览器中访问：https://github.com/HuFakai/cannon/archive/refs/heads/main.zip
2. 下载 `cannon-main.zip` 文件

### 2.2 上传到1Panel

1. 打开1Panel管理面板
2. 进入「文件」→「文件管理」
3. 选择合适的目录（如 `/opt/`）
4. 点击「上传」，上传下载的zip文件
5. 右键zip文件，选择「解压」

### 2.3 设置权限并部署

在1Panel终端中执行：

```bash
# 进入解压后的目录
cd /opt/cannon-main

# 给脚本执行权限
chmod +x *.sh

# 执行部署
./deploy.sh -p

# 验证部署
./1panel-check.sh
```

### 2.4 配置防火墙

在1Panel中开放端口3000和8080（参考步骤4）

---

## 🐳 方案3: 1Panel应用商店部署（最简单）

### 3.1 创建自定义应用

1. 在1Panel中进入「应用商店」→「已安装」
2. 点击「创建应用」→「自定义应用」
3. 应用名称：`炮与兵棋游戏`
4. 选择「Docker Compose」方式

### 3.2 使用我们提供的配置

将以下内容粘贴到Docker Compose配置中：

```yaml
version: '3.8'

services:
  cannon-game:
    image: node:18-alpine
    container_name: cannon-game-app
    restart: unless-stopped
    ports:
      - "3000:80"    # HTTP端口使用3000避免冲突
      - "8080:8080"  # WebSocket端口
    working_dir: /app
    volumes:
      - ./app:/app
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=8080
    command: |
      sh -c "
        if [ ! -f /app/package.json ]; then
          apk add --no-cache git curl
          git clone https://github.com/HuFakai/cannon.git /tmp/cannon
          cp -r /tmp/cannon/* /app/
          chmod +x /app/*.sh
        fi
        cd /app && npm install --production
        node server.js
      "
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 3.3 启动应用

1. 点击「确认」创建应用
2. 应用会自动下载代码、安装依赖并启动
3. 在应用详情中可以查看日志和状态

### 3.4 配置防火墙（重要！）

在1Panel防火墙中开放端口：
- 端口3000 (HTTP)
- 端口8080 (WebSocket)

---

## 🔍 部署验证

### 检查服务状态

```bash
# 检查容器是否运行
docker ps | grep cannon-game

# 检查端口监听（注意是3000端口）
netstat -tlnp | grep -E "3000|8080"

# 测试HTTP服务
curl http://localhost:3000/health

# 获取服务器IP
SERVER_IP=$(curl -s ipinfo.io/ip)
echo "游戏访问地址: http://$SERVER_IP:3000"
```

### 访问游戏

部署成功后，可以通过以下地址访问：

- **游戏主页**: http://您的服务器IP:3000
- **状态监控**: http://您的服务器IP:3000/status.html
- **健康检查**: http://您的服务器IP:3000/health

---

## 🚨 故障排除

### 问题1: Docker未安装

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

### 问题2: 端口被占用

```bash
# 查看3000和8080端口占用
netstat -tlnp | grep -E "3000|8080"

# 如果3000端口被占用，请参考《端口修改指南.md》
# 可以修改为其他端口，如8000
sed -i 's/"3000:80"/"8000:80"/g' docker-compose.yml
```

### 问题3: 权限问题

```bash
# 给脚本执行权限
chmod +x *.sh

# 如果是权限不足，使用sudo
sudo ./deploy.sh -p
```

### 问题4: 防火墙问题

**重要**: 必须在1Panel中开放端口3000和8080

1. 进入「安全」→「防火墙」
2. 添加规则：端口3000、8080
3. 协议选择TCP
4. 策略选择允许

### 问题5: 端口冲突解决

如果3000端口也被占用：

```bash
# 检查可用端口
./check_ports.sh

# 或者参考详细的端口修改指南
cat 端口修改指南.md
```

---

## 💡 建议的部署顺序

1. **首选**: 方案2（文件管理器）- 最稳定，避免git依赖
2. **次选**: 方案1（命令行）- 最灵活，便于管理
3. **备选**: 方案3（应用商店）- 最简单，自动化程度最高

选择最适合您操作习惯的方式即可！

---

## 🔧 端口自定义

如果默认端口3000和8080仍有冲突，可以：

1. **查看端口修改指南**: `端口修改指南.md`
2. **使用自动端口检测**: `./check_ports.sh`
3. **手动修改配置**: 编辑 `docker-compose.yml`

---

## 📞 获取帮助

如果遇到问题：

1. 运行检查脚本：`./1panel-check.sh`
2. 查看容器日志：`docker logs cannon-game-app`
3. 检查端口状态：`netstat -tlnp | grep -E "3000|8080"`
4. 检查1Panel系统日志
5. 参考完整文档：`DEPLOYMENT.md`
6. 参考端口修改：`端口修改指南.md`

**🎉 祝您部署顺利，享受游戏！**

**游戏访问地址**: http://您的服务器IP:3000 