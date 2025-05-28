#!/bin/bash

# 🎮 炮与兵棋游戏 - 超级一键部署脚本
# 专为不熟悉命令行的用户设计

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 显示欢迎界面
show_welcome() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    🎮 炮与兵棋游戏                                ║${NC}"
    echo -e "${BLUE}║                   超级一键部署脚本                               ║${NC}"
    echo -e "${BLUE}║                                                                  ║${NC}"
    echo -e "${BLUE}║  本脚本将自动完成以下操作：                                      ║${NC}"
    echo -e "${BLUE}║  • 检查系统环境                                                  ║${NC}"
    echo -e "${BLUE}║  • 安装必要依赖                                                  ║${NC}"
    echo -e "${BLUE}║  • 构建游戏镜像                                                  ║${NC}"
    echo -e "${BLUE}║  • 启动游戏服务                                                  ║${NC}"
    echo -e "${BLUE}║  • 验证部署结果                                                  ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🚀 准备开始部署，预计需要3-5分钟...${NC}"
    echo ""
    
    # 询问用户是否继续
    read -p "是否继续部署？(y/N): " confirm
    if [[ ! "$confirm" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}❌ 部署已取消${NC}"
        exit 0
    fi
}

# 检查系统环境
check_system() {
    echo -e "${YELLOW}📋 第1步：检查系统环境${NC}"
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "  ✅ 操作系统: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "  ✅ 操作系统: macOS"
    else
        echo -e "  ❌ 不支持的操作系统: $OSTYPE"
        exit 1
    fi
    
    # 检查是否为root用户或有sudo权限
    if [ "$EUID" -eq 0 ]; then
        echo -e "  ✅ 运行权限: root用户"
    elif sudo -n true 2>/dev/null; then
        echo -e "  ✅ 运行权限: sudo权限"
    else
        echo -e "  ⚠️  运行权限: 普通用户（可能需要输入密码）"
    fi
    
    echo ""
}

# 安装Docker（如果需要）
install_docker() {
    echo -e "${YELLOW}📦 第2步：检查并安装Docker${NC}"
    
    if command -v docker &> /dev/null; then
        echo -e "  ✅ Docker已安装: $(docker --version)"
        
        # 检查Docker服务状态
        if docker info &> /dev/null; then
            echo -e "  ✅ Docker服务运行正常"
        else
            echo -e "  🔄 启动Docker服务..."
            sudo systemctl start docker 2>/dev/null || true
        fi
    else
        echo -e "  📥 正在安装Docker..."
        
        # 根据系统类型安装Docker
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux系统
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker $USER
            rm get-docker.sh
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS系统
            echo -e "  ${YELLOW}请手动安装Docker Desktop for Mac${NC}"
            echo -e "  下载地址: https://www.docker.com/products/docker-desktop"
            exit 1
        fi
        
        echo -e "  ✅ Docker安装完成"
    fi
    
    # 安装Docker Compose（如果需要）
    if command -v docker-compose &> /dev/null; then
        echo -e "  ✅ Docker Compose已安装: $(docker-compose --version)"
    else
        echo -e "  📥 正在安装Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "  ✅ Docker Compose安装完成"
    fi
    
    echo ""
}

# 准备项目文件
prepare_files() {
    echo -e "${YELLOW}📁 第3步：准备项目文件${NC}"
    
    # 给脚本执行权限
    chmod +x *.sh 2>/dev/null || true
    echo -e "  ✅ 脚本权限设置完成"
    
    # 创建必要目录
    mkdir -p logs
    echo -e "  ✅ 日志目录创建完成"
    
    # 检查必需文件
    required_files=("Dockerfile" "docker-compose.yml" "server.js" "package.json")
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ✅ $file 文件存在"
        else
            echo -e "  ❌ $file 文件缺失"
            echo -e "  ${RED}请确保在正确的项目目录中运行此脚本${NC}"
            exit 1
        fi
    done
    
    echo ""
}

# 构建和部署
deploy_game() {
    echo -e "${YELLOW}🏗️ 第4步：构建和部署游戏${NC}"
    
    # 停止现有服务
    echo -e "  🛑 停止现有服务..."
    docker-compose down 2>/dev/null || true
    
    # 构建镜像
    echo -e "  🔨 构建Docker镜像..."
    docker-compose build --no-cache cannon-game
    
    # 启动服务
    echo -e "  🚀 启动游戏服务..."
    docker-compose up -d cannon-game
    
    # 等待服务启动
    echo -e "  ⏳ 等待服务启动..."
    sleep 10
    
    echo ""
}

# 验证部署
verify_deployment() {
    echo -e "${YELLOW}✅ 第5步：验证部署结果${NC}"
    
    # 检查容器状态
    if docker ps | grep -q cannon-game-app; then
        echo -e "  ✅ 容器运行正常"
        
        # 检查HTTP服务
        if curl -f -s http://localhost/health >/dev/null 2>&1; then
            echo -e "  ✅ HTTP服务正常"
        else
            echo -e "  ⚠️  HTTP服务启动中..."
            sleep 5
            if curl -f -s http://localhost/health >/dev/null 2>&1; then
                echo -e "  ✅ HTTP服务正常"
            else
                echo -e "  ❌ HTTP服务异常"
            fi
        fi
        
        # 检查WebSocket端口
        if netstat -tlnp 2>/dev/null | grep -q :8080; then
            echo -e "  ✅ WebSocket服务正常"
        else
            echo -e "  ❌ WebSocket服务异常"
        fi
    else
        echo -e "  ❌ 容器启动失败"
        echo -e "  📝 查看错误日志:"
        docker logs cannon-game-app 2>/dev/null || echo "  无法获取日志"
        return 1
    fi
    
    echo ""
}

# 显示成功信息
show_success() {
    local server_ip=$(curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')
    
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    🎉 部署成功完成！                             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${PURPLE}🌐 访问地址：${NC}"
    if [ ! -z "$server_ip" ]; then
        echo -e "  • 游戏主页: ${CYAN}http://$server_ip${NC}"
        echo -e "  • 状态监控: ${CYAN}http://$server_ip/status.html${NC}"
        echo -e "  • 健康检查: ${CYAN}http://$server_ip/health${NC}"
    else
        echo -e "  • 游戏主页: ${CYAN}http://your-server-ip${NC}"
        echo -e "  • 状态监控: ${CYAN}http://your-server-ip/status.html${NC}"
        echo -e "  • 健康检查: ${CYAN}http://your-server-ip/health${NC}"
    fi
    echo ""
    
    echo -e "${BLUE}🎮 游戏特色：${NC}"
    echo -e "  • 经典6x6棋盘策略游戏"
    echo -e "  • 支持实时联机对战"
    echo -e "  • 现代科技风UI设计"
    echo -e "  • 响应式移动端支持"
    echo ""
    
    echo -e "${YELLOW}🔧 管理命令：${NC}"
    echo -e "  • 查看状态: ${CYAN}./1panel-check.sh${NC}"
    echo -e "  • 查看日志: ${CYAN}docker logs cannon-game-app${NC}"
    echo -e "  • 重启服务: ${CYAN}docker restart cannon-game-app${NC}"
    echo -e "  • 停止服务: ${CYAN}./deploy.sh -s${NC}"
    echo ""
    
    echo -e "${GREEN}🎉 现在您可以开始享受游戏了！${NC}"
}

# 显示失败信息
show_failure() {
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    ❌ 部署失败                                   ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${YELLOW}🔧 排查建议：${NC}"
    echo -e "  1. 检查Docker服务: ${CYAN}sudo systemctl status docker${NC}"
    echo -e "  2. 查看容器日志: ${CYAN}docker logs cannon-game-app${NC}"
    echo -e "  3. 检查端口占用: ${CYAN}netstat -tlnp | grep -E '80|8080'${NC}"
    echo -e "  4. 重新部署: ${CYAN}./deploy.sh -c && ./deploy.sh -p${NC}"
    echo -e "  5. 运行完整检查: ${CYAN}./check-deployment.sh${NC}"
    echo ""
    
    echo -e "${CYAN}💬 获取帮助：${NC}"
    echo -e "  • 查看详细文档: ${CYAN}cat DEPLOYMENT.md${NC}"
    echo -e "  • 1Panel快速指南: ${CYAN}cat 1Panel部署快速指南.md${NC}"
    echo -e "  • 提交问题反馈到项目仓库"
}

# 主函数
main() {
    show_welcome
    check_system
    install_docker
    prepare_files
    deploy_game
    
    if verify_deployment; then
        show_success
    else
        show_failure
        exit 1
    fi
}

# 捕获错误
trap 'echo -e "\n${RED}❌ 部署过程中发生错误，请检查上方的错误信息${NC}"; show_failure; exit 1' ERR

# 执行主函数
main "$@" 