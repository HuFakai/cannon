#!/bin/bash

# 🔧 炮与兵棋游戏 - 自动端口检测脚本
# 功能：自动检测可用端口并更新docker-compose.yml配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 显示标题
show_title() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   🔧 自动端口检测与配置工具${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 记录日志
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

# 警告信息
warn() {
    echo -e "${YELLOW}⚠️  警告:${NC} $1"
}

# 错误信息
error() {
    echo -e "${RED}❌ 错误:${NC} $1"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if command -v netstat >/dev/null 2>&1; then
        # 使用netstat检查
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            return 1  # 端口被占用
        else
            return 0  # 端口可用
        fi
    elif command -v ss >/dev/null 2>&1; then
        # 使用ss检查
        if ss -tlnp 2>/dev/null | grep -q ":$port "; then
            return 1
        else
            return 0
        fi
    elif command -v lsof >/dev/null 2>&1; then
        # 使用lsof检查
        if lsof -i ":$port" >/dev/null 2>&1; then
            return 1
        else
            return 0
        fi
    else
        # 如果没有可用工具，尝试使用nc
        if command -v nc >/dev/null 2>&1; then
            if nc -z localhost $port 2>/dev/null; then
                return 1
            else
                return 0
            fi
        else
            warn "无法检测端口状态，将假设端口可用"
            return 0
        fi
    fi
}

# 查找可用端口
find_available_port() {
    local start_port=$1
    local port=$start_port
    local max_attempts=100
    
    log "从端口 $start_port 开始搜索可用端口..."
    
    while [ $port -lt $((start_port + max_attempts)) ]; do
        if check_port $port; then
            echo $port
            return 0
        fi
        ((port++))
    done
    
    error "在 $start_port-$((start_port + max_attempts)) 范围内未找到可用端口"
    return 1
}

# 显示端口占用信息
show_port_usage() {
    local port=$1
    echo "端口 $port 被以下进程占用："
    
    if command -v netstat >/dev/null 2>&1; then
        netstat -tlnp 2>/dev/null | grep ":$port " | head -3
    elif command -v ss >/dev/null 2>&1; then
        ss -tlnp 2>/dev/null | grep ":$port " | head -3
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i ":$port" 2>/dev/null | head -3
    fi
    echo ""
}

# 备份配置文件
backup_config() {
    if [ -f "docker-compose.yml" ]; then
        local backup_file="docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)"
        cp docker-compose.yml "$backup_file"
        log "配置文件已备份到: $backup_file"
    fi
}

# 更新docker-compose.yml
update_docker_compose() {
    local http_port=$1
    local ws_port=$2
    
    if [ ! -f "docker-compose.yml" ]; then
        error "未找到 docker-compose.yml 文件"
        return 1
    fi
    
    log "更新 docker-compose.yml 配置..."
    
    # 备份配置文件
    backup_config
    
    # 更新HTTP端口映射
    sed -i.tmp "s/\"[0-9]*:80\"/\"$http_port:80\"/g" docker-compose.yml
    
    # 更新WebSocket端口映射
    sed -i.tmp "s/\"[0-9]*:8080\"/\"$ws_port:8080\"/g" docker-compose.yml
    
    # 更新环境变量中的端口
    sed -i.tmp "s/PORT=[0-9]*/PORT=$ws_port/g" docker-compose.yml
    
    # 删除临时文件
    rm -f docker-compose.yml.tmp
    
    log "✅ 配置文件更新完成"
}

# 显示当前端口配置
show_current_config() {
    if [ -f "docker-compose.yml" ]; then
        echo -e "${BLUE}当前端口配置:${NC}"
        grep -n "ports:" -A 3 docker-compose.yml | head -10
        echo ""
    fi
}

# 主程序
main() {
    show_title
    
    # 检查是否在正确的目录
    if [ ! -f "docker-compose.yml" ]; then
        error "未找到 docker-compose.yml 文件"
        echo "请确保在项目根目录运行此脚本"
        exit 1
    fi
    
    log "开始检测端口可用性..."
    echo ""
    
    # 显示当前配置
    show_current_config
    
    # 检测HTTP端口（从3000开始）
    log "🔍 检测HTTP服务端口..."
    if check_port 3000; then
        HTTP_PORT=3000
        log "✅ 端口 3000 可用 (HTTP服务)"
    else
        warn "端口 3000 被占用"
        show_port_usage 3000
        
        log "搜索其他可用端口..."
        HTTP_PORT=$(find_available_port 3001)
        if [ $? -eq 0 ]; then
            log "✅ 找到可用HTTP端口: $HTTP_PORT"
        else
            error "无法找到可用的HTTP端口"
            exit 1
        fi
    fi
    
    echo ""
    
    # 检测WebSocket端口（从8080开始）
    log "🔍 检测WebSocket服务端口..."
    if check_port 8080; then
        WS_PORT=8080
        log "✅ 端口 8080 可用 (WebSocket服务)"
    else
        warn "端口 8080 被占用"
        show_port_usage 8080
        
        log "搜索其他可用端口..."
        WS_PORT=$(find_available_port 8081)
        if [ $? -eq 0 ]; then
            log "✅ 找到可用WebSocket端口: $WS_PORT"
        else
            error "无法找到可用的WebSocket端口"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${GREEN}=========== 端口分配结果 ===========${NC}"
    echo -e "HTTP服务端口:    ${BLUE}$HTTP_PORT${NC}"
    echo -e "WebSocket端口:   ${BLUE}$WS_PORT${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo ""
    
    # 询问是否更新配置
    read -p "是否更新 docker-compose.yml 配置? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_docker_compose $HTTP_PORT $WS_PORT
        
        echo ""
        echo -e "${GREEN}🎉 端口配置更新完成！${NC}"
        echo ""
        echo -e "${BLUE}接下来需要：${NC}"
        echo "1. 在1Panel防火墙中开放端口 $HTTP_PORT 和 $WS_PORT"
        echo "2. 重新部署服务: docker-compose up -d --force-recreate"
        echo "3. 游戏访问地址: http://您的服务器IP:$HTTP_PORT"
        echo ""
        
        # 询问是否重新部署
        read -p "是否立即重新部署服务? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "重新部署服务..."
            
            if command -v docker-compose >/dev/null 2>&1; then
                docker-compose down 2>/dev/null || true
                docker-compose up -d --force-recreate
                
                echo ""
                log "等待服务启动..."
                sleep 10
                
                # 测试服务
                log "测试服务连通性..."
                if curl -f -s "http://localhost:$HTTP_PORT/health" >/dev/null; then
                    echo -e "${GREEN}✅ 服务启动成功！${NC}"
                    
                    # 获取服务器IP
                    if command -v curl >/dev/null 2>&1; then
                        SERVER_IP=$(curl -s ipinfo.io/ip 2>/dev/null || echo "您的服务器IP")
                        echo -e "${BLUE}🎮 游戏访问地址: http://$SERVER_IP:$HTTP_PORT${NC}"
                    fi
                else
                    warn "服务可能还未完全启动，请稍后访问"
                fi
            else
                error "未找到 docker-compose 命令，请手动重新部署"
            fi
        fi
        
    else
        log "配置未更新，您可以后续手动执行此脚本"
    fi
    
    echo ""
    log "端口检测完成"
}

# 处理中断信号
trap 'echo -e "\n${YELLOW}检测被中断${NC}"; exit 1' INT

# 执行主程序
main "$@" 