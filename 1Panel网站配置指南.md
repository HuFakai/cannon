# 1Panel 网站配置指南

## 概述
在1Panel中部署炮与兵棋游戏需要创建网站配置，通过反向代理将域名或IP地址映射到Docker容器端口。

## 配置步骤

### 步骤1：创建网站
1. 登录1Panel管理面板
2. 进入 **网站** → **网站管理**
3. 点击 **创建网站**

### 步骤2：网站基本配置
```
网站类型: 反向代理
主域名: 您的服务器IP地址或域名
例如: 101.126.146.167
端口: 80 (如果80端口被占用，可选择其他端口如8080)
```

### 步骤3：反向代理设置
```
代理地址: http://127.0.0.1:3000
代理端口: 3000
```

**详细配置示例：**
```nginx
# 反向代理配置
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket 支持
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# WebSocket 专用代理 (端口8080)
location /socket.io/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 步骤4：SSL配置（可选）
如果需要HTTPS访问：
1. 选择 **SSL证书**
2. 可选择：
   - Let's Encrypt 免费证书（需要域名）
   - 自签名证书
   - 上传自有证书

### 步骤5：防火墙配置
确保以下端口已开放：
```
端口 80   - HTTP访问
端口 443  - HTTPS访问（如果启用SSL）
端口 3000 - 容器HTTP端口
端口 8080 - 容器WebSocket端口
```

## 配置方案对比

### 方案A：使用80端口（推荐）
```
1Panel网站配置:
- 监听端口: 80
- 代理地址: http://127.0.0.1:3000
- 访问地址: http://101.126.146.167
```

### 方案B：使用自定义端口
```
1Panel网站配置:
- 监听端口: 8080
- 代理地址: http://127.0.0.1:3000
- 访问地址: http://101.126.146.167:8080
```

## 完整配置步骤截图说明

### 1. 创建网站界面
```
网站管理 → 创建网站
├── 网站类型: 反向代理
├── 主域名: 101.126.146.167
├── 端口: 80
└── 代理地址: http://127.0.0.1:3000
```

### 2. 高级配置
```
高级设置
├── 开启WebSocket支持
├── 设置代理超时: 60s
├── 开启缓存: 关闭
└── 日志记录: 开启
```

## 验证配置

### 检查网站状态
1. 在1Panel中查看网站状态应为 **运行中**
2. 检查Nginx配置是否正确生成

### 测试访问
```bash
# 测试HTTP访问
curl -I http://101.126.146.167

# 测试WebSocket连接
curl -I http://101.126.146.167:8080/socket.io/
```

## 故障排除

### 问题1：502 Bad Gateway
**原因：** 容器端口3000无法访问
**解决方案：**
```bash
# 检查容器状态
docker ps | grep cannon

# 检查端口监听
docker exec cannon-game-app netstat -tlnp

# 重启容器
docker restart cannon-game-app
```

### 问题2：404 Not Found
**原因：** 反向代理配置错误
**解决方案：**
1. 检查1Panel网站配置中的代理地址
2. 确认代理地址为 `http://127.0.0.1:3000`
3. 重新生成Nginx配置

### 问题3：WebSocket连接失败
**原因：** WebSocket代理配置缺失
**解决方案：**
1. 在网站配置中添加WebSocket代理规则
2. 确保升级协议头正确设置

### 问题4：防火墙阻止访问
**解决方案：**
```bash
# 检查防火墙状态
ufw status

# 开放必要端口
ufw allow 80
ufw allow 3000
ufw allow 8080
```

## 自动化配置脚本

以下是一个自动化1Panel网站配置的建议：

```bash
#!/bin/bash
# 1panel-website-setup.sh

echo "🌐 开始配置1Panel网站..."

# 检查1Panel是否运行
if ! pgrep -f "1panel" > /dev/null; then
    echo "❌ 1Panel未运行，请先启动1Panel"
    exit 1
fi

echo "✅ 1Panel运行正常"
echo ""
echo "请手动完成以下配置："
echo "1. 登录1Panel: http://你的服务器IP:设置的端口/login"
echo "2. 进入 网站 → 网站管理 → 创建网站"
echo "3. 配置如下："
echo "   - 网站类型: 反向代理"
echo "   - 主域名: $(curl -s ifconfig.me)"
echo "   - 端口: 80"
echo "   - 代理地址: http://127.0.0.1:3000"
echo ""
echo "4. 高级设置中启用WebSocket支持"
echo "5. 保存配置"
echo ""
echo "配置完成后访问: http://$(curl -s ifconfig.me)"
```

## 注意事项

1. **端口冲突**：确保80端口未被其他服务占用
2. **域名解析**：如使用域名，确保DNS解析正确
3. **容器健康**：确保cannon-game-app容器运行正常
4. **网络连通**：确保1Panel能访问容器端口3000
5. **日志监控**：定期查看Nginx访问日志和错误日志

## 配置完成验证清单

- [ ] 1Panel网站创建成功
- [ ] 反向代理配置正确
- [ ] 防火墙端口已开放
- [ ] 容器运行状态正常
- [ ] HTTP访问测试通过
- [ ] WebSocket连接测试通过
- [ ] 游戏界面正常显示

配置完成后，您应该能够通过 `http://您的服务器IP` 访问炮与兵棋游戏。 