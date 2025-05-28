#!/bin/bash

# 炮与兵棋游戏 - 自动化部署脚本
# 使用方法: ./deploy.sh [选项]
# 选项: 
#   -h, --help      显示帮助信息
#   -b, --build     只构建镜像
#   -d, --dev       开发模式部署
#   -p, --prod      生产模式部署（默认）
#   -s, --stop      停止服务
#   -c, --clean     清理所有数据

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
炮与兵棋游戏 - 自动化部署脚本

使用方法: $0 [选项]

选项:
    -h, --help      显示此帮助信息
    -b, --build     只构建Docker镜像
    -d, --dev       开发模式部署（包含Redis和数据库）
    -p, --prod      生产模式部署（默认，仅主应用）
    -s, --stop      停止所有服务
    -c, --clean     清理所有数据和镜像
    -l, --logs      查看实时日志

示例:
    $0 -p           # 生产环境部署
    $0 -d           # 开发环境部署
    $0 -s           # 停止服务
    $0 -c           # 清理环境
EOF
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_info "Docker环境检查通过"
}

# 构建镜像
build_image() {
    log_info "开始构建Docker镜像..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 构建镜像
    docker-compose build --no-cache cannon-game
    
    log_success "Docker镜像构建完成"
}

# 生产环境部署
deploy_production() {
    log_info "开始生产环境部署..."
    
    # 停止现有服务
    docker-compose down 2>/dev/null || true
    
    # 构建并启动服务
    docker-compose up -d cannon-game
    
    log_success "生产环境部署完成"
    log_info "访问地址: http://localhost"
    log_info "WebSocket端口: 8080"
}

# 开发环境部署
deploy_development() {
    log_info "开始开发环境部署（包含Redis和数据库）..."
    
    # 停止现有服务
    docker-compose --profile redis --profile database down 2>/dev/null || true
    
    # 构建并启动所有服务
    docker-compose --profile redis --profile database up -d
    
    log_success "开发环境部署完成"
    log_info "访问地址: http://localhost"
    log_info "WebSocket端口: 8080"
    log_info "Redis端口: 6379"
    log_info "PostgreSQL端口: 5432"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    
    docker-compose --profile redis --profile database down
    
    log_success "所有服务已停止"
}

# 清理环境
clean_environment() {
    log_warning "这将删除所有容器、镜像和数据，确定要继续吗？(y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "清理Docker环境..."
        
        # 停止并删除容器
        docker-compose --profile redis --profile database down -v 2>/dev/null || true
        
        # 删除镜像
        docker rmi cannonweb_cannon-game 2>/dev/null || true
        
        # 删除未使用的卷
        docker volume prune -f
        
        # 删除日志文件
        rm -rf logs/*
        
        log_success "环境清理完成"
    else
        log_info "取消清理操作"
    fi
}

# 查看日志
show_logs() {
    log_info "显示实时日志（按Ctrl+C退出）..."
    docker-compose logs -f cannon-game
}

# 健康检查
health_check() {
    log_info "进行健康检查..."
    
    # 检查容器状态
    if docker ps | grep -q cannon-game-app; then
        log_success "主容器运行正常"
    else
        log_error "主容器未运行"
        return 1
    fi
    
    # 检查HTTP服务
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log_success "HTTP服务正常"
    else
        log_error "HTTP服务异常"
        return 1
    fi
    
    # 检查WebSocket服务
    if netstat -tlnp 2>/dev/null | grep -q :8080; then
        log_success "WebSocket服务正常"
    else
        log_error "WebSocket服务异常"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 主函数
main() {
    # 检查Docker环境
    check_docker
    
    # 解析命令行参数
    case "${1:-prod}" in
        -h|--help)
            show_help
            ;;
        -b|--build)
            build_image
            ;;
        -d|--dev)
            build_image
            deploy_development
            sleep 5
            health_check
            ;;
        -p|--prod|prod)
            build_image
            deploy_production
            sleep 5
            health_check
            ;;
        -s|--stop)
            stop_services
            ;;
        -c|--clean)
            clean_environment
            ;;
        -l|--logs)
            show_logs
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 