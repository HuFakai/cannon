#!/bin/bash

# 🎮 炮与兵棋游戏 - 交互式部署助手
# 为用户提供人性化的部署体验

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# 全局变量
DEPLOY_TYPE=""
SERVER_IP=""
DOMAIN_NAME=""
USE_SSL=false
AUTO_BACKUP=false

# 显示欢迎界面
show_welcome() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                     🎮 炮与兵棋游戏                                 ║${NC}"
    echo -e "${BLUE}║                    交互式部署助手 v1.0                            ║${NC}"
    echo -e "${BLUE}║                                                                    ║${NC}"
    echo -e "${BLUE}║  欢迎使用！本助手将帮助您轻松部署炮与兵棋游戏                      ║${NC}"
    echo -e "${BLUE}║  只需要回答几个简单问题，即可完成专业级部署                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🎯 支持的部署方式：${NC}"
    echo -e "  • 1Panel一键部署（推荐）"
    echo -e "  • Docker Compose手动部署"
    echo -e "  • 开发环境部署"
    echo ""
    echo -e "${GREEN}✨ 游戏特色：经典6x6棋盘策略游戏，支持实时联机对战${NC}"
    echo ""
}

# 选择部署类型
choose_deploy_type() {
    echo -e "${YELLOW}📋 请选择部署方式：${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} 1Panel一键部署 ${CYAN}（推荐，零配置）${NC}"
    echo -e "  ${GREEN}2)${NC} Docker Compose部署 ${CYAN}（适合有Docker经验的用户）${NC}"
    echo -e "  ${GREEN}3)${NC} 开发环境部署 ${CYAN}（包含完整开发工具）${NC}"
    echo -e "  ${GREEN}4)${NC} 仅构建镜像 ${CYAN}（不启动服务）${NC}"
    echo -e "  ${GREEN}5)${NC} 查看系统状态 ${CYAN}（检查现有部署）${NC}"
    echo ""
    
    while true; do
        read -p "请输入选项 (1-5): " choice
        case $choice in
            1)
                DEPLOY_TYPE="1panel"
                echo -e "✅ 已选择：1Panel一键部署"
                break
                ;;
            2)
                DEPLOY_TYPE="docker"
                echo -e "✅ 已选择：Docker Compose部署"
                break
                ;;
            3)
                DEPLOY_TYPE="dev"
                echo -e "✅ 已选择：开发环境部署"
                break
                ;;
            4)
                DEPLOY_TYPE="build"
                echo -e "✅ 已选择：仅构建镜像"
                break
                ;;
            5)
                show_current_status
                return
                ;;
            *)
                echo -e "${RED}❌ 无效选项，请输入1-5${NC}"
                ;;
        esac
    done
    echo ""
}

# 获取部署参数
get_deploy_params() {
    echo -e "${YELLOW}⚙️ 配置部署参数：${NC}"
    echo ""
    
    # 获取服务器IP
    local auto_ip=$(curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')
    if [ ! -z "$auto_ip" ]; then
        echo -e "检测到服务器IP：${CYAN}$auto_ip${NC}"
        read -p "是否使用此IP？(Y/n): " use_auto_ip
        if [[ "$use_auto_ip" =~ ^([nN][oO]|[nN])$ ]]; then
            read -p "请输入服务器IP: " SERVER_IP
        else
            SERVER_IP="$auto_ip"
        fi
    else
        read -p "请输入服务器IP: " SERVER_IP
    fi
    
    # 域名配置（可选）
    echo ""
    read -p "是否使用自定义域名？(y/N): " use_domain
    if [[ "$use_domain" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        read -p "请输入域名: " DOMAIN_NAME
        
        # SSL证书选项
        read -p "是否启用SSL证书？(y/N): " enable_ssl
        if [[ "$enable_ssl" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            USE_SSL=true
        fi
    fi
    
    # 备份选项
    echo ""
    read -p "是否启用自动备份？(y/N): " enable_backup
    if [[ "$enable_backup" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        AUTO_BACKUP=true
    fi
    
    echo ""
    echo -e "${GREEN}✅ 配置完成！${NC}"
    echo ""
}

# 显示配置摘要
show_config_summary() {
    echo -e "${PURPLE}📋 部署配置摘要：${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════${NC}"
    echo -e "  🚀 部署方式: ${CYAN}$DEPLOY_TYPE${NC}"
    echo -e "  🌐 服务器IP: ${CYAN}$SERVER_IP${NC}"
    
    if [ ! -z "$DOMAIN_NAME" ]; then
        echo -e "  🔗 域名: ${CYAN}$DOMAIN_NAME${NC}"
    fi
    
    if [ "$USE_SSL" = true ]; then
        echo -e "  🔒 SSL证书: ${GREEN}启用${NC}"
    else
        echo -e "  🔓 SSL证书: ${YELLOW}未启用${NC}"
    fi
    
    if [ "$AUTO_BACKUP" = true ]; then
        echo -e "  💾 自动备份: ${GREEN}启用${NC}"
    else
        echo -e "  💾 自动备份: ${YELLOW}未启用${NC}"
    fi
    
    echo ""
    echo -e "📍 部署完成后的访问地址："
    if [ ! -z "$DOMAIN_NAME" ]; then
        if [ "$USE_SSL" = true ]; then
            echo -e "  • 游戏地址: ${CYAN}https://$DOMAIN_NAME${NC}"
            echo -e "  • 状态监控: ${CYAN}https://$DOMAIN_NAME/status.html${NC}"
        else
            echo -e "  • 游戏地址: ${CYAN}http://$DOMAIN_NAME${NC}"
            echo -e "  • 状态监控: ${CYAN}http://$DOMAIN_NAME/status.html${NC}"
        fi
    else
        echo -e "  • 游戏地址: ${CYAN}http://$SERVER_IP${NC}"
        echo -e "  • 状态监控: ${CYAN}http://$SERVER_IP/status.html${NC}"
    fi
    echo ""
    
    read -p "确认开始部署？(Y/n): " confirm
    if [[ "$confirm" =~ ^([nN][oO]|[nN])$ ]]; then
        echo -e "${YELLOW}❌ 部署已取消${NC}"
        exit 0
    fi
}

# 执行部署
execute_deploy() {
    echo -e "${YELLOW}🚀 开始执行部署...${NC}"
    echo ""
    
    case $DEPLOY_TYPE in
        "1panel")
            deploy_1panel
            ;;
        "docker")
            deploy_docker
            ;;
        "dev")
            deploy_dev
            ;;
        "build")
            build_only
            ;;
    esac
}

# 1Panel部署
deploy_1panel() {
    echo -e "${BLUE}📦 执行1Panel一键部署${NC}"
    
    # 检查1Panel环境
    if [ -d "/opt/1panel" ] || [ -f "/usr/local/bin/1pctl" ]; then
        echo -e "  ✅ 检测到1Panel环境"
    else
        echo -e "  ⚠️  未检测到1Panel环境，将使用标准Docker部署"
    fi
    
    # 给执行权限
    chmod +x *.sh 2>/dev/null || true
    
    # 使用现有的部署脚本
    echo -e "  🔨 开始部署..."
    if [ -f "./deploy.sh" ]; then
        ./deploy.sh -p
    else
        echo -e "  ❌ 未找到deploy.sh脚本"
        exit 1
    fi
    
    # 运行1Panel专用检查
    if [ -f "./1panel-check.sh" ]; then
        echo -e "  🔍 运行部署验证..."
        ./1panel-check.sh
    fi
}

# Docker Compose部署
deploy_docker() {
    echo -e "${BLUE}🐳 执行Docker Compose部署${NC}"
    
    # 检查Docker环境
    if ! command -v docker &> /dev/null; then
        echo -e "  ❌ Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "  ❌ Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 停止现有服务
    echo -e "  🛑 停止现有服务..."
    docker-compose down 2>/dev/null || true
    
    # 构建和启动
    echo -e "  🔨 构建镜像..."
    docker-compose build --no-cache cannon-game
    
    echo -e "  🚀 启动服务..."
    docker-compose up -d cannon-game
    
    # 等待启动
    echo -e "  ⏳ 等待服务启动..."
    sleep 15
    
    # 验证部署
    verify_deployment
}

# 开发环境部署
deploy_dev() {
    echo -e "${BLUE}💻 执行开发环境部署${NC}"
    
    # 使用开发配置
    if [ -f "./deploy.sh" ]; then
        ./deploy.sh -d
    else
        echo -e "  ❌ 未找到deploy.sh脚本"
        exit 1
    fi
}

# 仅构建镜像
build_only() {
    echo -e "${BLUE}🔨 仅构建镜像${NC}"
    
    docker build -t cannon-game:latest .
    echo -e "  ✅ 镜像构建完成：cannon-game:latest"
}

# 验证部署
verify_deployment() {
    echo -e "${YELLOW}✅ 验证部署结果${NC}"
    
    local success=true
    
    # 检查容器状态
    if docker ps | grep -q cannon-game-app; then
        echo -e "  ✅ 容器运行正常"
    else
        echo -e "  ❌ 容器未运行"
        success=false
    fi
    
    # 检查HTTP服务
    if curl -f -s http://localhost/health >/dev/null 2>&1; then
        echo -e "  ✅ HTTP服务正常"
    else
        echo -e "  ❌ HTTP服务异常"
        success=false
    fi
    
    # 检查WebSocket端口
    if netstat -tlnp 2>/dev/null | grep -q :8080; then
        echo -e "  ✅ WebSocket服务正常"
    else
        echo -e "  ❌ WebSocket服务异常"
        success=false
    fi
    
    if [ "$success" = true ]; then
        show_success_info
    else
        show_failure_info
    fi
}

# 显示成功信息
show_success_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                      🎉 部署成功！                                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${PURPLE}🌐 访问信息：${NC}"
    if [ ! -z "$DOMAIN_NAME" ]; then
        local protocol="http"
        if [ "$USE_SSL" = true ]; then
            protocol="https"
        fi
        echo -e "  • 游戏地址: ${CYAN}${protocol}://$DOMAIN_NAME${NC}"
        echo -e "  • 状态监控: ${CYAN}${protocol}://$DOMAIN_NAME/status.html${NC}"
        echo -e "  • 健康检查: ${CYAN}${protocol}://$DOMAIN_NAME/health${NC}"
    else
        echo -e "  • 游戏地址: ${CYAN}http://$SERVER_IP${NC}"
        echo -e "  • 状态监控: ${CYAN}http://$SERVER_IP/status.html${NC}"
        echo -e "  • 健康检查: ${CYAN}http://$SERVER_IP/health${NC}"
    fi
    echo ""
    
    echo -e "${BLUE}🎮 开始游戏：${NC}"
    echo -e "  1. 在浏览器中打开游戏地址"
    echo -e "  2. 点击'创建房间'开始新游戏"
    echo -e "  3. 分享房间号给朋友一起游戏"
    echo ""
    
    echo -e "${YELLOW}🔧 管理命令：${NC}"
    echo -e "  • 查看状态: ${CYAN}./1panel-check.sh${NC}"
    echo -e "  • 查看日志: ${CYAN}docker logs cannon-game-app${NC}"
    echo -e "  • 重启服务: ${CYAN}docker restart cannon-game-app${NC}"
    echo -e "  • 更新部署: ${CYAN}./部署助手.sh${NC}"
}

# 显示失败信息
show_failure_info() {
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                      ❌ 部署失败                                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${YELLOW}🔧 排查建议：${NC}"
    echo -e "  1. 检查Docker服务状态"
    echo -e "  2. 查看容器日志: ${CYAN}docker logs cannon-game-app${NC}"
    echo -e "  3. 检查端口占用: ${CYAN}netstat -tlnp | grep -E '80|8080'${NC}"
    echo -e "  4. 重新运行部署助手"
    echo ""
    
    read -p "是否查看错误日志？(y/N): " show_logs
    if [[ "$show_logs" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${CYAN}📝 容器日志：${NC}"
        docker logs cannon-game-app 2>/dev/null | tail -20 || echo "无法获取日志"
    fi
}

# 显示当前状态
show_current_status() {
    clear
    echo -e "${BLUE}📊 当前系统状态${NC}"
    echo ""
    
    # 运行检查脚本
    if [ -f "./1panel-check.sh" ]; then
        ./1panel-check.sh
    elif [ -f "./check-deployment.sh" ]; then
        ./check-deployment.sh
    else
        # 手动检查
        echo -e "${YELLOW}🔍 手动状态检查${NC}"
        
        if command -v docker &> /dev/null; then
            echo -e "  ✅ Docker已安装"
            
            if docker ps | grep -q cannon-game-app; then
                echo -e "  ✅ 游戏容器运行中"
                
                if curl -f -s http://localhost/health >/dev/null 2>&1; then
                    echo -e "  ✅ 游戏服务正常"
                    echo ""
                    echo -e "🌐 游戏地址: ${CYAN}http://localhost${NC}"
                else
                    echo -e "  ❌ 游戏服务异常"
                fi
            else
                echo -e "  ❌ 游戏容器未运行"
            fi
        else
            echo -e "  ❌ Docker未安装"
        fi
    fi
    
    echo ""
    read -p "按回车键返回主菜单..."
}

# 显示帮助菜单
show_help() {
    echo -e "${CYAN}❓ 部署助手帮助${NC}"
    echo ""
    echo -e "${WHITE}可用选项：${NC}"
    echo -e "  • 1Panel部署：适合使用1Panel管理面板的用户"
    echo -e "  • Docker部署：适合有Docker经验的用户"
    echo -e "  • 开发部署：包含完整的开发环境"
    echo -e "  • 仅构建：只构建Docker镜像，不启动服务"
    echo -e "  • 查看状态：检查当前部署状态"
    echo ""
    echo -e "${WHITE}常见问题：${NC}"
    echo -e "  Q: 端口被占用怎么办？"
    echo -e "  A: 修改docker-compose.yml中的端口映射"
    echo ""
    echo -e "  Q: 容器启动失败？"
    echo -e "  A: 查看容器日志排查问题"
    echo ""
    echo -e "  Q: 如何更新游戏？"
    echo -e "  A: 重新运行部署助手即可"
    echo ""
    read -p "按回车键返回主菜单..."
}

# 主菜单循环
main_menu() {
    while true; do
        show_welcome
        
        echo -e "${WHITE}请选择操作：${NC}"
        echo -e "  ${GREEN}1)${NC} 开始部署"
        echo -e "  ${GREEN}2)${NC} 查看当前状态"
        echo -e "  ${GREEN}3)${NC} 帮助信息"
        echo -e "  ${GREEN}4)${NC} 退出"
        echo ""
        
        read -p "请输入选项 (1-4): " main_choice
        
        case $main_choice in
            1)
                choose_deploy_type
                if [ "$DEPLOY_TYPE" != "" ]; then
                    get_deploy_params
                    show_config_summary
                    execute_deploy
                    echo ""
                    read -p "按回车键返回主菜单..."
                fi
                ;;
            2)
                show_current_status
                ;;
            3)
                show_help
                ;;
            4)
                echo -e "${CYAN}👋 感谢使用炮与兵棋游戏部署助手！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 无效选项，请输入1-4${NC}"
                sleep 2
                ;;
        esac
    done
}

# 主函数
main() {
    # 检查是否在正确的目录
    if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
        echo -e "${RED}❌ 请在项目根目录中运行此脚本${NC}"
        exit 1
    fi
    
    # 启动主菜单
    main_menu
}

# 捕获Ctrl+C
trap 'echo -e "\n${YELLOW}👋 部署已取消${NC}"; exit 0' INT

# 执行主函数
main "$@" 