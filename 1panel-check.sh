#!/bin/bash

# 炮与兵棋游戏 - 1Panel专用部署检查脚本
# 简化版本，专为1Panel用户设计

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 统计变量
total_checks=0
passed_checks=0

# 显示标题
show_title() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                   🎮 炮与兵棋游戏                              ║${NC}"
    echo -e "${BLUE}║                  1Panel 部署检查工具                          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 检查函数
check_status() {
    local name="$1"
    local command="$2"
    local success_msg="$3"
    local fail_msg="$4"
    
    total_checks=$((total_checks + 1))
    echo -n "  正在检查 $name ... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $success_msg${NC}"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo -e "${RED}❌ $fail_msg${NC}"
        return 1
    fi
}

# 获取服务器IP
get_server_ip() {
    local ip=$(curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')
    echo "$ip"
}

# 主检查流程
main_check() {
    show_title
    
    echo -e "${CYAN}🔍 开始检查部署状态...${NC}"
    echo ""
    
    # 基础环境检查
    echo -e "${YELLOW}📋 基础环境检查${NC}"
    check_status "Docker环境" "command -v docker" "Docker已安装" "Docker未安装"
    check_status "Docker服务" "docker info" "Docker服务运行正常" "Docker服务未启动"
    echo ""
    
    # 容器状态检查
    echo -e "${YELLOW}🐳 容器状态检查${NC}"
    check_status "主容器" "docker ps | grep cannon-game-app" "容器运行正常" "容器未运行"
    
    if docker ps | grep -q cannon-game-app; then
        # 获取容器详细信息
        container_status=$(docker ps --format "table {{.Status}}" | grep -A1 "STATUS" | tail -1)
        echo -e "    📊 容器状态: ${GREEN}$container_status${NC}"
        
        # 检查资源使用
        resource_info=$(docker stats cannon-game-app --no-stream --format "CPU: {{.CPUPerc}} | 内存: {{.MemUsage}}" 2>/dev/null)
        if [ ! -z "$resource_info" ]; then
            echo -e "    💻 资源使用: ${CYAN}$resource_info${NC}"
        fi
    fi
    echo ""
    
    # 服务可用性检查
    echo -e "${YELLOW}🌐 服务可用性检查${NC}"
    check_status "HTTP服务" "curl -f -s http://localhost/health" "Web服务正常" "Web服务异常"
    check_status "端口80" "netstat -tlnp 2>/dev/null | grep ':80 '" "HTTP端口监听正常" "HTTP端口未监听"
    check_status "端口8080" "netstat -tlnp 2>/dev/null | grep ':8080 '" "WebSocket端口监听正常" "WebSocket端口未监听"
    echo ""
    
    # 1Panel集成检查
    echo -e "${YELLOW}⚙️  1Panel集成检查${NC}"
    
    # 检查是否在1Panel环境中
    if [ -d "/opt/1panel" ] || [ -f "/usr/local/bin/1pctl" ]; then
        echo -e "  ${GREEN}✅ 检测到1Panel环境${NC}"
        
        # 检查容器是否被1Panel管理
        if docker ps --format "{{.Labels}}" | grep -q "createdBy.*1Panel"; then
            echo -e "  ${GREEN}✅ 容器已被1Panel管理${NC}"
        else
            echo -e "  ${YELLOW}⚠️  容器未被1Panel管理（手动部署）${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  未检测到1Panel环境${NC}"
    fi
    echo ""
    
    # 显示访问信息
    show_access_info
    
    # 显示结果总结
    show_summary
}

# 显示访问信息
show_access_info() {
    local server_ip=$(get_server_ip)
    
    echo -e "${PURPLE}🔗 访问信息${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════${NC}"
    
    if [ ! -z "$server_ip" ]; then
        echo -e "  🌐 游戏地址:    ${CYAN}http://$server_ip${NC}"
        echo -e "  📊 状态监控:    ${CYAN}http://$server_ip/status.html${NC}"
        echo -e "  💚 健康检查:    ${CYAN}http://$server_ip/health${NC}"
    else
        echo -e "  🌐 游戏地址:    ${CYAN}http://your-server-ip${NC}"
        echo -e "  📊 状态监控:    ${CYAN}http://your-server-ip/status.html${NC}"
        echo -e "  💚 健康检查:    ${CYAN}http://your-server-ip/health${NC}"
    fi
    
    echo -e "  🔧 1Panel管理:  ${CYAN}容器 -> 容器管理 -> cannon-game-app${NC}"
    echo ""
}

# 显示结果总结
show_summary() {
    echo -e "${PURPLE}📋 检查结果总结${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════${NC}"
    
    if [ $passed_checks -eq $total_checks ]; then
        echo -e "  ${GREEN}🎉 所有检查项通过！($passed_checks/$total_checks)${NC}"
        echo -e "  ${GREEN}📱 游戏部署成功，可以正常使用！${NC}"
        echo ""
        
        echo -e "${BLUE}🎮 快速操作${NC}"
        echo -e "  • 打开游戏: 在浏览器中访问上方的游戏地址"
        echo -e "  • 查看日志: 在1Panel中进入容器管理查看日志"
        echo -e "  • 重启服务: 在1Panel中重启cannon-game-app容器"
        
    else
        echo -e "  ${RED}❌ 部分检查失败 ($passed_checks/$total_checks)${NC}"
        echo ""
        
        echo -e "${YELLOW}🔧 建议操作${NC}"
        echo -e "  1. 检查1Panel中的Docker服务状态"
        echo -e "  2. 查看容器日志: docker logs cannon-game-app"
        echo -e "  3. 重新部署: ./deploy.sh -p"
        echo -e "  4. 运行完整检查: ./check-deployment.sh"
    fi
    
    echo ""
    echo -e "${CYAN}💡 提示: 如需详细诊断信息，请运行 './check-deployment.sh'${NC}"
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}1Panel 部署检查工具使用说明${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示此帮助信息"
    echo "  -q, --quiet   静默模式（仅显示结果）"
    echo "  -v, --verbose 详细模式（显示所有信息）"
    echo ""
    echo "示例:"
    echo "  $0            # 标准检查"
    echo "  $0 -q         # 静默检查"
    echo "  $0 -v         # 详细检查"
}

# 静默模式检查
quiet_check() {
    if docker ps | grep -q cannon-game-app && curl -f -s http://localhost/health >/dev/null; then
        echo -e "${GREEN}✅ 游戏服务运行正常${NC}"
        local server_ip=$(get_server_ip)
        if [ ! -z "$server_ip" ]; then
            echo -e "🌐 访问地址: ${CYAN}http://$server_ip${NC}"
        fi
        exit 0
    else
        echo -e "${RED}❌ 游戏服务异常${NC}"
        echo -e "💡 运行 '$0 -v' 查看详细信息"
        exit 1
    fi
}

# 主函数
main() {
    case "$1" in
        -h|--help)
            show_help
            ;;
        -q|--quiet)
            quiet_check
            ;;
        -v|--verbose)
            # 使用完整的检查脚本
            if [ -f "./check-deployment.sh" ]; then
                ./check-deployment.sh
            else
                echo -e "${YELLOW}⚠️  未找到详细检查脚本，使用标准检查...${NC}"
                main_check
            fi
            ;;
        "")
            main_check
            ;;
        *)
            echo -e "${RED}错误: 未知选项 '$1'${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 