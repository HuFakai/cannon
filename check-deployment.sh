#!/bin/bash

# 炮与兵棋游戏 - 部署检查脚本
# 用于验证部署是否成功

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查项计数
total_checks=0
passed_checks=0

# 检查函数
check_item() {
    local description="$1"
    local command="$2"
    local expected="$3"
    
    total_checks=$((total_checks + 1))
    echo -n "检查 $description ... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        return 1
    fi
}

# 详细检查函数
check_detailed() {
    local description="$1"
    local command="$2"
    
    total_checks=$((total_checks + 1))
    echo -e "${BLUE}检查 $description${NC}"
    
    if result=$(eval "$command" 2>&1); then
        echo -e "${GREEN}✓ 通过${NC}"
        echo "$result" | head -3
        passed_checks=$((passed_checks + 1))
        echo ""
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "$result" | head -3
        echo ""
        return 1
    fi
}

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  炮与兵棋游戏 - 部署状态检查${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# 基础环境检查
echo -e "${YELLOW}1. 基础环境检查${NC}"
check_item "Docker是否安装" "command -v docker"
check_item "Docker Compose是否安装" "command -v docker-compose"
check_item "curl是否可用" "command -v curl"
echo ""

# 容器状态检查
echo -e "${YELLOW}2. 容器运行状态${NC}"
check_item "主容器是否运行" "docker ps | grep cannon-game-app"
check_detailed "容器详细状态" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep cannon-game"

# 网络连通性检查
echo -e "${YELLOW}3. 网络服务检查${NC}"
check_item "HTTP服务是否可访问" "curl -f -s http://localhost/health"
check_item "端口80是否监听" "netstat -tlnp 2>/dev/null | grep ':80 '"
check_item "端口8080是否监听" "netstat -tlnp 2>/dev/null | grep ':8080 '"

# 应用功能检查
echo -e "${YELLOW}4. 应用功能检查${NC}"
check_detailed "前端页面响应" "curl -s -w 'HTTP状态: %{http_code}\n响应时间: %{time_total}s\n大小: %{size_download} bytes' http://localhost"
check_item "健康检查端点" "curl -f -s http://localhost/health | grep -q healthy"

# 日志检查
echo -e "${YELLOW}5. 日志状态检查${NC}"
check_item "容器日志是否正常" "docker logs cannon-game-app --tail 10 | grep -v ERROR"
check_item "Nginx访问日志" "docker exec cannon-game-app test -f /var/log/nginx/access.log"
check_item "应用日志目录" "test -d ./logs"

# WebSocket连接测试
echo -e "${YELLOW}6. WebSocket服务检查${NC}"
check_item "WebSocket端口连通性" "timeout 3 bash -c '</dev/tcp/localhost/8080'"

# 资源使用情况
echo -e "${YELLOW}7. 资源使用情况${NC}"
check_detailed "容器资源使用" "docker stats cannon-game-app --no-stream --format 'CPU: {{.CPUPerc}}\nMemory: {{.MemUsage}}\nNet I/O: {{.NetIO}}'"

# 显示总结
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}           检查结果总结${NC}"
echo -e "${BLUE}===========================================${NC}"

if [ $passed_checks -eq $total_checks ]; then
    echo -e "${GREEN}🎉 所有检查项通过！($passed_checks/$total_checks)${NC}"
    echo -e "${GREEN}游戏部署成功，可以正常使用！${NC}"
    echo ""
    echo -e "${BLUE}访问地址：${NC}"
    echo "  - 游戏主页: http://localhost"
    echo "  - 健康检查: http://localhost/health"
    echo "  - WebSocket: ws://localhost:8080"
    exit 0
else
    echo -e "${RED}❌ 部分检查失败 ($passed_checks/$total_checks)${NC}"
    echo -e "${YELLOW}建议检查以下内容：${NC}"
    echo "  1. 确保Docker服务正在运行"
    echo "  2. 检查端口是否被占用"
    echo "  3. 查看容器日志: docker logs cannon-game-app"
    echo "  4. 重新部署: ./deploy.sh -p"
    exit 1
fi 