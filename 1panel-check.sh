#!/bin/bash

# 🎮 炮与兵棋游戏 - 1Panel环境检查工具
# 专为1Panel用户优化的简化版检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 游戏配置
GAME_NAME="炮与兵棋游戏"
CONTAINER_NAME="cannon-game-app"
HTTP_PORT=3000  # 修改默认HTTP端口为3000
WS_PORT=8080    # WebSocket端口保持8080
HEALTH_ENDPOINT="/health"

# 显示欢迎标题
show_welcome() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         🎮 ${GAME_NAME} 🎮         ║${NC}"
    echo -e "${BLUE}║           1Panel 环境检查             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

# 成功消息
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 警告消息
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 错误消息
error() {
    echo -e "${RED}❌ $1${NC}"
}

# 信息消息
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# 检查Docker环境
check_docker() {
    echo -e "${PURPLE}[1/8]${NC} 检查Docker环境..."
    
    if command -v docker >/dev/null 2>&1; then
        local docker_version=$(docker --version 2>/dev/null | head -1)
        success "Docker已安装: $docker_version"
        
        if docker info >/dev/null 2>&1; then
            success "Docker服务运行正常"
        else
            error "Docker服务未运行"
            info "1Panel中重启Docker: 容器 → Docker → 重启"
            return 1
        fi
    else
        error "Docker未安装"
        info "1Panel中安装Docker: 应用商店 → Docker → 安装"
        return 1
    fi
}

# 检查Docker Compose
check_compose() {
    echo -e "${PURPLE}[2/8]${NC} 检查Docker Compose..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        local compose_version=$(docker-compose --version 2>/dev/null)
        success "Docker Compose已安装: $compose_version"
    elif docker compose version >/dev/null 2>&1; then
        local compose_version=$(docker compose version 2>/dev/null)
        success "Docker Compose Plugin已安装: $compose_version"
    else
        error "Docker Compose未安装"
        info "1Panel会自动安装Docker Compose"
        return 1
    fi
}

# 检查端口占用 - 使用新的端口配置
check_ports() {
    echo -e "${PURPLE}[3/8]${NC} 检查端口占用..."
    
    # 检查HTTP端口3000
    if netstat -tlnp 2>/dev/null | grep -q ":$HTTP_PORT " || ss -tlnp 2>/dev/null | grep -q ":$HTTP_PORT "; then
        # 检查是否是我们的容器占用的
        if docker ps 2>/dev/null | grep -q "$CONTAINER_NAME.*:$HTTP_PORT->"; then
            success "端口 $HTTP_PORT 被游戏容器正常使用"
        else
            warning "端口 $HTTP_PORT 被其他进程占用"
            info "查看占用进程: netstat -tlnp | grep :$HTTP_PORT"
            info "自动修复端口: ./check_ports.sh"
        fi
    else
        success "端口 $HTTP_PORT 可用"
    fi
    
    # 检查WebSocket端口8080
    if netstat -tlnp 2>/dev/null | grep -q ":$WS_PORT " || ss -tlnp 2>/dev/null | grep -q ":$WS_PORT "; then
        if docker ps 2>/dev/null | grep -q "$CONTAINER_NAME.*:$WS_PORT->"; then
            success "端口 $WS_PORT 被游戏容器正常使用"
        else
            warning "端口 $WS_PORT 被其他进程占用"
            info "查看占用进程: netstat -tlnp | grep :$WS_PORT"
            info "自动修复端口: ./check_ports.sh"
        fi
    else
        success "端口 $WS_PORT 可用"
    fi
}

# 检查项目文件
check_files() {
    echo -e "${PURPLE}[4/8]${NC} 检查项目文件..."
    
    local required_files=("docker-compose.yml" "Dockerfile" "package.json" "server.js")
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            success "找到文件: $file"
        else
            error "缺少文件: $file"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        warning "缺少 ${#missing_files[@]} 个重要文件"
        info "重新下载项目: git clone https://github.com/HuFakai/cannon.git"
        return 1
    fi
}

# 检查容器状态
check_container() {
    echo -e "${PURPLE}[5/8]${NC} 检查容器状态..."
    
    if docker ps 2>/dev/null | grep -q "$CONTAINER_NAME"; then
        success "游戏容器正在运行"
        
        # 显示容器详细信息
        local container_info=$(docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | tail -n +2)
        if [ -n "$container_info" ]; then
            info "容器信息: $container_info"
        fi
        
        # 检查容器健康状态
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
        case "$health_status" in
            "healthy")
                success "容器健康状态: 正常"
                ;;
            "unhealthy")
                warning "容器健康状态: 异常"
                info "查看容器日志: docker logs $CONTAINER_NAME"
                ;;
            "starting")
                info "容器健康状态: 启动中"
                ;;
            *)
                info "容器健康状态: 未知"
                ;;
        esac
        
    elif docker ps -a 2>/dev/null | grep -q "$CONTAINER_NAME"; then
        warning "游戏容器已创建但未运行"
        info "启动容器: docker-compose up -d"
    else
        warning "游戏容器不存在"
        info "创建并启动: docker-compose up -d"
    fi
}

# 检查服务连通性 - 使用新端口
check_connectivity() {
    echo -e "${PURPLE}[6/8]${NC} 检查服务连通性..."
    
    # 检查HTTP服务
    if curl -f -s -m 10 "http://localhost:$HTTP_PORT$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        success "HTTP服务正常 (端口 $HTTP_PORT)"
    else
        warning "HTTP服务无响应 (端口 $HTTP_PORT)"
        info "检查容器状态: docker logs $CONTAINER_NAME --tail 50"
        
        # 尝试其他检查方法
        if nc -z localhost $HTTP_PORT 2>/dev/null; then
            info "端口 $HTTP_PORT 可访问，但服务可能还在启动中"
        else
            warning "端口 $HTTP_PORT 无法访问"
        fi
    fi
    
    # 检查WebSocket端口连通性
    if nc -z localhost $WS_PORT 2>/dev/null; then
        success "WebSocket端口连通 (端口 $WS_PORT)"
    else
        warning "WebSocket端口无法访问 (端口 $WS_PORT)"
    fi
}

# 检查1Panel防火墙配置
check_firewall() {
    echo -e "${PURPLE}[7/8]${NC} 检查1Panel防火墙配置..."
    
    # 获取服务器外网IP
    local server_ip=""
    if command -v curl >/dev/null 2>&1; then
        server_ip=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null || echo "")
    fi
    
    if [ -n "$server_ip" ]; then
        info "服务器外网IP: $server_ip"
        
        # 测试外网访问
        info "测试外网访问..."
        if curl -f -s -m 10 "http://$server_ip:$HTTP_PORT$HEALTH_ENDPOINT" >/dev/null 2>&1; then
            success "外网可正常访问游戏"
        else
            warning "外网无法访问游戏"
            echo ""
            echo -e "${YELLOW}请在1Panel中配置防火墙：${NC}"
            echo "1. 进入：安全 → 防火墙"
            echo "2. 添加规则：端口 $HTTP_PORT，协议 TCP，策略 允许"
            echo "3. 添加规则：端口 $WS_PORT，协议 TCP，策略 允许"
        fi
    else
        warning "无法获取服务器IP"
        info "请手动检查防火墙配置"
    fi
}

# 显示访问信息
show_access_info() {
    echo -e "${PURPLE}[8/8]${NC} 显示访问信息..."
    
    # 获取服务器IP
    local server_ip=""
    if command -v curl >/dev/null 2>&1; then
        server_ip=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null)
    fi
    
    if [ -z "$server_ip" ]; then
        server_ip="您的服务器IP"
    fi
    
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║             🌐 访问信息                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}游戏地址:${NC} http://$server_ip:$HTTP_PORT"
    echo -e "${GREEN}状态监控:${NC} http://$server_ip:$HTTP_PORT/status.html"
    echo -e "${GREEN}健康检查:${NC} http://$server_ip:$HTTP_PORT/health"
    echo ""
    
    # 显示端口信息
    echo -e "${CYAN}端口配置:${NC}"
    echo -e "  HTTP服务: $HTTP_PORT"
    echo -e "  WebSocket: $WS_PORT"
    echo ""
}

# 显示操作建议
show_suggestions() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║             💡 操作建议                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    
    echo -e "${CYAN}如果遇到问题：${NC}"
    echo "• 端口冲突: ./check_ports.sh"
    echo "• 重新部署: docker-compose up -d --force-recreate"
    echo "• 查看日志: docker logs $CONTAINER_NAME"
    echo "• 完整检查: ./deploy.sh -c"
    echo ""
    
    echo -e "${CYAN}1Panel操作：${NC}"
    echo "• 防火墙设置: 安全 → 防火墙"
    echo "• 容器管理: 容器 → Docker"
    echo "• 文件管理: 文件 → 文件管理"
    echo ""
}

# 主程序
main() {
    show_welcome
    
    local check_failed=0
    
    # 执行所有检查
    check_docker || ((check_failed++))
    echo ""
    
    check_compose || ((check_failed++))
    echo ""
    
    check_ports || ((check_failed++))
    echo ""
    
    check_files || ((check_failed++))
    echo ""
    
    check_container || ((check_failed++))
    echo ""
    
    check_connectivity || ((check_failed++))
    echo ""
    
    check_firewall || ((check_failed++))
    echo ""
    
    show_access_info
    show_suggestions
    
    # 显示检查结果总结
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║             📊 检查结果                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    
    if [ $check_failed -eq 0 ]; then
        echo -e "${GREEN}🎉 所有检查通过！游戏部署成功！${NC}"
        echo -e "${GREEN}   您可以开始使用 $GAME_NAME 了${NC}"
    else
        echo -e "${YELLOW}⚠️  发现 $check_failed 个问题，请参考上面的建议进行修复${NC}"
        
        if [ $check_failed -ge 3 ]; then
            echo ""
            echo -e "${CYAN}建议执行完整重新部署：${NC}"
            echo "./deploy.sh -p"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}需要帮助？查看文档：${NC}"
    echo "• 1Panel部署指南: 1Panel服务器部署指南.md"
    echo "• 端口修改指南: 端口修改指南.md"
    echo "• 完整文档: README.md"
    echo ""
}

# 执行主程序
main "$@" 