#!/bin/bash

# 1Panel网站配置脚本
# 用于自动配置炮与兵棋游戏的反向代理

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示Logo
show_logo() {
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                  🎮 炮与兵棋游戏                              ║"
    echo "║                1Panel 网站配置向导                            ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 获取服务器IP
get_server_ip() {
    local ip
    ip=$(curl -s ifconfig.me 2>/dev/null)
    if [[ -z "$ip" ]]; then
        ip=$(curl -s ipinfo.io/ip 2>/dev/null)
    fi
    if [[ -z "$ip" ]]; then
        ip=$(hostname -I | awk '{print $1}')
    fi
    echo "$ip"
}

# 检查1Panel状态
check_1panel() {
    echo -e "${BLUE}🔍 检查1Panel状态...${NC}"
    
    if ! command -v 1pctl &> /dev/null; then
        echo -e "${RED}❌ 1Panel未安装${NC}"
        return 1
    fi
    
    if ! pgrep -f "1panel" > /dev/null; then
        echo -e "${YELLOW}⚠️  1Panel未运行，尝试启动...${NC}"
        systemctl start 1panel 2>/dev/null || service 1panel start 2>/dev/null
        sleep 3
        
        if ! pgrep -f "1panel" > /dev/null; then
            echo -e "${RED}❌ 1Panel启动失败${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}✅ 1Panel运行正常${NC}"
    return 0
}

# 检查容器状态
check_container() {
    echo -e "${BLUE}🐳 检查游戏容器状态...${NC}"
    
    if ! docker ps | grep -q "cannon-game-app"; then
        echo -e "${RED}❌ 游戏容器未运行${NC}"
        echo -e "${YELLOW}请先运行: ./deploy.sh${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ 游戏容器运行正常${NC}"
    return 0
}

# 检查端口占用
check_ports() {
    echo -e "${BLUE}🔌 检查端口占用情况...${NC}"
    
    local port_80_used=false
    local port_3000_used=false
    local port_8080_used=false
    
    # 检查端口80
    if netstat -tlnp 2>/dev/null | grep -q ":80 " || ss -tlnp 2>/dev/null | grep -q ":80 "; then
        port_80_used=true
        echo -e "${YELLOW}⚠️  端口80已被占用${NC}"
    else
        echo -e "${GREEN}✅ 端口80可用${NC}"
    fi
    
    # 检查端口3000
    if netstat -tlnp 2>/dev/null | grep -q ":3000 " || ss -tlnp 2>/dev/null | grep -q ":3000 "; then
        port_3000_used=true
        echo -e "${GREEN}✅ 端口3000已使用（游戏容器）${NC}"
    else
        echo -e "${RED}❌ 端口3000未使用${NC}"
    fi
    
    # 检查端口8080
    if netstat -tlnp 2>/dev/null | grep -q ":8080 " || ss -tlnp 2>/dev/null | grep -q ":8080 "; then
        port_8080_used=true
        echo -e "${GREEN}✅ 端口8080已使用（WebSocket）${NC}"
    else
        echo -e "${RED}❌ 端口8080未使用${NC}"
    fi
    
    return 0
}

# 获取1Panel访问信息
get_1panel_info() {
    echo -e "${BLUE}📋 获取1Panel访问信息...${NC}"
    
    local panel_port
    local panel_entrance
    
    # 尝试从配置文件获取端口和入口
    if [[ -f "/opt/1panel/conf/app.yaml" ]]; then
        panel_port=$(grep -E "^\s*port:" /opt/1panel/conf/app.yaml | awk '{print $2}' | head -1)
        panel_entrance=$(grep -E "^\s*entrance:" /opt/1panel/conf/app.yaml | awk '{print $2}' | head -1)
    fi
    
    # 默认值
    panel_port=${panel_port:-10086}
    panel_entrance=${panel_entrance:-""}
    
    local server_ip
    server_ip=$(get_server_ip)
    
    echo -e "${CYAN}📱 1Panel访问信息:${NC}"
    if [[ -n "$panel_entrance" ]]; then
        echo -e "   🌐 访问地址: http://${server_ip}:${panel_port}/${panel_entrance}"
    else
        echo -e "   🌐 访问地址: http://${server_ip}:${panel_port}"
    fi
    echo -e "   🔑 端口: ${panel_port}"
    if [[ -n "$panel_entrance" ]]; then
        echo -e "   🚪 安全入口: /${panel_entrance}"
    fi
    echo ""
}

# 显示配置步骤
show_config_steps() {
    local server_ip
    server_ip=$(get_server_ip)
    
    echo -e "${CYAN}📖 1Panel网站配置步骤:${NC}"
    echo ""
    echo -e "${YELLOW}步骤1: 登录1Panel管理面板${NC}"
    echo "   - 使用上面提供的访问地址登录"
    echo ""
    echo -e "${YELLOW}步骤2: 创建网站${NC}"
    echo "   - 进入 网站 → 网站管理"
    echo "   - 点击 创建网站"
    echo ""
    echo -e "${YELLOW}步骤3: 网站基本配置${NC}"
    echo "   - 网站类型: 反向代理"
    echo "   - 主域名: ${server_ip}"
    echo "   - 端口: 80 (如果被占用则选择其他端口)"
    echo ""
    echo -e "${YELLOW}步骤4: 反向代理设置${NC}"
    echo "   - 代理地址: http://127.0.0.1:3000"
    echo "   - 代理端口: 3000"
    echo ""
    echo -e "${YELLOW}步骤5: 高级设置${NC}"
    echo "   - ✅ 开启WebSocket支持"
    echo "   - ✅ 设置代理超时: 60s"
    echo "   - ❌ 关闭缓存"
    echo "   - ✅ 开启日志记录"
    echo ""
    echo -e "${YELLOW}步骤6: 保存配置${NC}"
    echo "   - 点击确定保存配置"
    echo "   - 等待Nginx配置生成"
    echo ""
}

# 显示Nginx配置模板
show_nginx_config() {
    echo -e "${CYAN}📄 Nginx配置模板 (供参考):${NC}"
    echo ""
    cat << 'EOF'
server {
    listen 80;
    server_name your_server_ip;
    
    # 主页面代理
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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket 专用代理
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
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
EOF
    echo ""
}

# 测试访问
test_access() {
    local server_ip
    server_ip=$(get_server_ip)
    
    echo -e "${BLUE}🔍 测试访问连通性...${NC}"
    
    # 测试容器内部访问
    echo -n "   测试容器内部HTTP服务 ... "
    if docker exec cannon-game-app curl -s http://localhost:80 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
    fi
    
    # 测试本地3000端口
    echo -n "   测试本地3000端口 ... "
    if curl -s http://127.0.0.1:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
    fi
    
    # 测试WebSocket端口
    echo -n "   测试WebSocket端口8080 ... "
    if curl -s http://127.0.0.1:8080/socket.io/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}📋 配置完成后的访问地址:${NC}"
    echo -e "   🎮 游戏地址: http://${server_ip}"
    echo -e "   💚 健康检查: http://${server_ip}/health"
    echo -e "   📊 状态监控: http://${server_ip}/status.html"
    echo ""
}

# 显示配置完成后的验证步骤
show_verification() {
    local server_ip
    server_ip=$(get_server_ip)
    
    echo -e "${CYAN}✅ 配置完成验证清单:${NC}"
    echo ""
    echo "请在1Panel配置完成后，执行以下验证："
    echo ""
    echo "1. 🌐 访问测试:"
    echo "   curl -I http://${server_ip}"
    echo ""
    echo "2. 🎮 游戏界面测试:"
    echo "   打开浏览器访问: http://${server_ip}"
    echo "   应该看到"大炮轰小兵"游戏界面"
    echo ""
    echo "3. 🔌 WebSocket测试:"
    echo "   curl -I http://${server_ip}/socket.io/"
    echo ""
    echo "4. 📊 健康检查:"
    echo "   curl http://${server_ip}/health"
    echo ""
    echo "5. 📋 1Panel网站状态:"
    echo "   在1Panel中检查网站状态为'运行中'"
    echo ""
}

# 故障排除指南
show_troubleshooting() {
    echo -e "${CYAN}🔧 常见问题排除:${NC}"
    echo ""
    echo -e "${YELLOW}问题1: 502 Bad Gateway${NC}"
    echo "解决方案:"
    echo "  - 检查游戏容器是否运行: docker ps | grep cannon"
    echo "  - 重启容器: docker restart cannon-game-app"
    echo "  - 检查端口3000是否监听: netstat -tlnp | grep 3000"
    echo ""
    echo -e "${YELLOW}问题2: 404 Not Found${NC}"
    echo "解决方案:"
    echo "  - 检查反向代理地址是否为: http://127.0.0.1:3000"
    echo "  - 重新生成1Panel网站配置"
    echo ""
    echo -e "${YELLOW}问题3: WebSocket连接失败${NC}"
    echo "解决方案:"
    echo "  - 确保在1Panel高级设置中启用WebSocket支持"
    echo "  - 检查端口8080是否被防火墙阻止"
    echo ""
    echo -e "${YELLOW}问题4: 无法访问${NC}"
    echo "解决方案:"
    echo "  - 检查防火墙: ufw status"
    echo "  - 开放端口: ufw allow 80"
    echo "  - 检查云服务器安全组设置"
    echo ""
}

# 主函数
main() {
    show_logo
    
    # 检查系统状态
    if ! check_1panel; then
        echo -e "${RED}❌ 1Panel检查失败，请确保1Panel已正确安装并运行${NC}"
        exit 1
    fi
    
    if ! check_container; then
        echo -e "${RED}❌ 游戏容器检查失败${NC}"
        exit 1
    fi
    
    check_ports
    
    echo ""
    get_1panel_info
    
    show_config_steps
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    show_nginx_config
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    test_access
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    show_verification
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    show_troubleshooting
    
    echo -e "${GREEN}🎉 配置向导完成！请按照上述步骤在1Panel中创建网站配置。${NC}"
    echo -e "${CYAN}💡 如有问题，请查看故障排除指南或运行 ./fix-deployment.sh${NC}"
}

# 执行主函数
main "$@" 