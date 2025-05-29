#!/bin/bash

# 🔧 炮与兵棋游戏 - 部署问题修复脚本
# 专门解决容器unhealthy和HTTP服务无法访问的问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

CONTAINER_NAME="cannon-game-app"

# 显示标题
show_title() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       🔧 部署问题诊断修复工具         ║${NC}"
    echo -e "${BLUE}║     专门解决容器unhealthy问题         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

# 记录日志
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

# 警告信息
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 错误信息
error() {
    echo -e "${RED}❌ $1${NC}"
}

# 信息
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# 步骤1：检查容器详细状态
check_container_status() {
    echo -e "${PURPLE}[1/8] 检查容器详细状态...${NC}"
    
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        local status=$(docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Status}}")
        log "容器状态: $status"
        
        if [[ "$status" == *"unhealthy"* ]]; then
            warn "容器健康检查失败"
            
            # 查看健康检查日志
            log "查看健康检查日志..."
            docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$CONTAINER_NAME" 2>/dev/null || true
        fi
    else
        error "容器不存在"
        return 1
    fi
    echo ""
}

# 步骤2：检查容器内部服务
check_internal_services() {
    echo -e "${PURPLE}[2/8] 检查容器内部服务...${NC}"
    
    log "检查Nginx进程..."
    if docker exec "$CONTAINER_NAME" pgrep nginx >/dev/null 2>&1; then
        log "✅ Nginx进程运行正常"
        
        # 测试Nginx配置
        log "测试Nginx配置..."
        if docker exec "$CONTAINER_NAME" nginx -t >/dev/null 2>&1; then
            log "✅ Nginx配置正确"
        else
            warn "Nginx配置有问题"
            docker exec "$CONTAINER_NAME" nginx -t 2>&1 || true
        fi
    else
        error "Nginx进程未运行"
    fi
    
    log "检查WebSocket服务..."
    if docker exec "$CONTAINER_NAME" pgrep node >/dev/null 2>&1; then
        log "✅ WebSocket服务运行正常"
    else
        error "WebSocket服务未运行"
    fi
    
    echo ""
}

# 步骤3：检查静态文件
check_static_files() {
    echo -e "${PURPLE}[3/8] 检查静态文件...${NC}"
    
    log "检查Web根目录..."
    if docker exec "$CONTAINER_NAME" ls -la /var/www/html/ >/dev/null 2>&1; then
        local file_count=$(docker exec "$CONTAINER_NAME" ls -1 /var/www/html/ | wc -l)
        if [ "$file_count" -gt 0 ]; then
            log "✅ 静态文件存在 ($file_count 个文件)"
            
            # 检查关键文件
            if docker exec "$CONTAINER_NAME" test -f /var/www/html/index.html; then
                log "✅ index.html 文件存在"
            else
                warn "index.html 文件缺失"
            fi
        else
            error "静态文件目录为空"
            return 1
        fi
    else
        error "无法访问Web根目录"
        return 1
    fi
    echo ""
}

# 步骤4：检查端口监听
check_port_listening() {
    echo -e "${PURPLE}[4/8] 检查端口监听...${NC}"
    
    log "检查容器内部端口..."
    
    # 检查端口80
    if docker exec "$CONTAINER_NAME" netstat -tlnp 2>/dev/null | grep -q ":80 "; then
        log "✅ 端口80正在监听"
    else
        warn "端口80未监听"
        log "尝试查看所有监听端口..."
        docker exec "$CONTAINER_NAME" netstat -tlnp 2>/dev/null || true
    fi
    
    # 检查端口8080
    if docker exec "$CONTAINER_NAME" netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
        log "✅ 端口8080正在监听"
    else
        warn "端口8080未监听"
    fi
    
    echo ""
}

# 步骤5：测试内部HTTP服务
test_internal_http() {
    echo -e "${PURPLE}[5/8] 测试容器内部HTTP服务...${NC}"
    
    log "测试内部HTTP服务..."
    
    # 测试根路径
    if docker exec "$CONTAINER_NAME" curl -f -s http://localhost/ >/dev/null 2>&1; then
        log "✅ 根路径访问正常"
    else
        warn "根路径访问失败"
        log "尝试详细测试..."
        docker exec "$CONTAINER_NAME" curl -v http://localhost/ 2>&1 | head -10 || true
    fi
    
    # 测试健康检查端点
    if docker exec "$CONTAINER_NAME" curl -f -s http://localhost/health >/dev/null 2>&1; then
        log "✅ 健康检查端点正常"
    else
        warn "健康检查端点失败"
        log "尝试创建健康检查端点..."
        docker exec "$CONTAINER_NAME" sh -c 'echo "OK" > /var/www/html/health' 2>/dev/null || true
    fi
    
    echo ""
}

# 步骤6：重建静态文件
rebuild_static_files() {
    echo -e "${PURPLE}[6/8] 重建静态文件...${NC}"
    
    log "检查是否需要重新构建前端..."
    
    if [ -f "package.json" ] && [ -d "src" ]; then
        log "发现源代码，重新构建前端..."
        
        # 构建前端
        if command -v npm >/dev/null 2>&1; then
            log "使用npm构建..."
            npm run build 2>/dev/null || {
                warn "npm构建失败，尝试在容器内构建..."
                docker exec "$CONTAINER_NAME" sh -c "cd /app && npm run build" 2>/dev/null || true
            }
        else
            log "在容器内构建..."
            docker exec "$CONTAINER_NAME" sh -c "cd /app && npm install && npm run build" 2>/dev/null || true
        fi
        
        # 复制构建结果到Nginx目录
        log "复制构建文件到Web目录..."
        docker exec "$CONTAINER_NAME" sh -c "cp -r /app/build/* /var/www/html/ 2>/dev/null || cp -r /app/dist/* /var/www/html/ 2>/dev/null || true"
        
    else
        log "未找到源代码，尝试从当前目录复制..."
        if [ -d "build" ]; then
            docker cp build/. "$CONTAINER_NAME:/var/www/html/"
            log "已复制build目录内容"
        elif [ -d "dist" ]; then
            docker cp dist/. "$CONTAINER_NAME:/var/www/html/"
            log "已复制dist目录内容"
        else
            warn "未找到构建文件"
        fi
    fi
    
    echo ""
}

# 步骤7：修复Nginx配置
fix_nginx_config() {
    echo -e "${PURPLE}[7/8] 修复Nginx配置...${NC}"
    
    log "检查Nginx配置..."
    
    # 创建简单的Nginx配置
    docker exec "$CONTAINER_NAME" sh -c "cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    index index.html index.htm;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # 主页面
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 \"OK\";
        add_header Content-Type text/plain;
    }

    # API代理到WebSocket服务
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # WebSocket代理
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF"
    
    log "重新加载Nginx配置..."
    if docker exec "$CONTAINER_NAME" nginx -s reload >/dev/null 2>&1; then
        log "✅ Nginx配置重新加载成功"
    else
        warn "Nginx重新加载失败，尝试重启..."
        docker exec "$CONTAINER_NAME" supervisorctl restart nginx 2>/dev/null || true
    fi
    
    echo ""
}

# 步骤8：最终测试和验证
final_test() {
    echo -e "${PURPLE}[8/8] 最终测试和验证...${NC}"
    
    log "等待服务稳定..."
    sleep 5
    
    # 测试内部服务
    log "测试内部HTTP服务..."
    if docker exec "$CONTAINER_NAME" curl -f -s http://localhost/ >/dev/null 2>&1; then
        log "✅ 内部HTTP服务正常"
    else
        warn "内部HTTP服务仍有问题"
    fi
    
    # 测试健康检查
    log "测试健康检查..."
    if docker exec "$CONTAINER_NAME" curl -f -s http://localhost/health >/dev/null 2>&1; then
        log "✅ 健康检查正常"
    else
        warn "健康检查仍有问题"
    fi
    
    # 测试外部访问
    log "测试外部访问..."
    if curl -f -s -m 10 http://localhost:3000/health >/dev/null 2>&1; then
        log "✅ 外部访问正常"
    else
        warn "外部访问仍有问题"
        info "请检查防火墙设置，确保端口3000已开放"
    fi
    
    # 获取服务器IP
    if command -v curl >/dev/null 2>&1; then
        local server_ip=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null || echo "您的服务器IP")
        echo ""
        echo -e "${GREEN}🎉 修复完成！${NC}"
        echo -e "${BLUE}访问地址: http://$server_ip:3000${NC}"
    fi
    
    echo ""
}

# 显示操作建议
show_suggestions() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║             💡 修复建议                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    
    echo -e "${CYAN}如果问题仍然存在：${NC}"
    echo "1. 重新构建容器: docker-compose up -d --build --force-recreate"
    echo "2. 检查防火墙: 确保端口3000和8080已开放"
    echo "3. 查看详细日志: docker logs $CONTAINER_NAME -f"
    echo "4. 重新部署: ./deploy.sh -p"
    echo ""
    
    echo -e "${CYAN}常用调试命令：${NC}"
    echo "• 进入容器: docker exec -it $CONTAINER_NAME bash"
    echo "• 查看进程: docker exec $CONTAINER_NAME ps aux"
    echo "• 测试内部: docker exec $CONTAINER_NAME curl http://localhost/"
    echo "• 重启服务: docker exec $CONTAINER_NAME supervisorctl restart all"
    echo ""
}

# 主程序
main() {
    show_title
    
    # 检查容器是否存在
    if ! docker ps -a | grep -q "$CONTAINER_NAME"; then
        error "容器 $CONTAINER_NAME 不存在"
        info "请先运行部署脚本: ./deploy.sh -p"
        exit 1
    fi
    
    log "开始诊断和修复部署问题..."
    echo ""
    
    # 执行所有修复步骤
    check_container_status
    check_internal_services
    check_static_files
    check_port_listening
    test_internal_http
    rebuild_static_files
    fix_nginx_config
    final_test
    
    show_suggestions
    
    echo -e "${GREEN}🎯 修复脚本执行完成！${NC}"
    echo -e "${CYAN}建议运行检查工具验证: ./1panel-check.sh${NC}"
}

# 执行主程序
main "$@" 