#!/bin/bash

# 炮与兵棋游戏 - 重新部署检查脚本
# 全面检查部署环境和文件，提供重新部署方案

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
    echo "║                  重新部署检查工具                              ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查部署文件完整性
check_deployment_files() {
    echo -e "${BLUE}📁 检查部署文件完整性...${NC}"
    
    local missing_files=()
    local required_files=(
        "docker-compose.yml"
        "Dockerfile"
        "deploy.sh"
        "server.js"
        "package.json"
        "src/"
        "public/"
        "docker/"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -e "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ 所有核心部署文件完整${NC}"
    else
        echo -e "${RED}❌ 缺少以下关键文件:${NC}"
        for file in "${missing_files[@]}"; do
            echo -e "   ${RED}• $file${NC}"
        done
        return 1
    fi
}

# 检查部署脚本
check_deployment_scripts() {
    echo -e "${BLUE}🔧 检查部署脚本...${NC}"
    
    local scripts=(
        "deploy.sh:1Panel专用部署脚本"
        "一键部署.sh:零基础用户超级一键部署"
        "部署助手.sh:交互式部署助手"
        "check_ports.sh:自动端口检测工具"
        "1panel-check.sh:1Panel检查工具"
        "1panel-website-setup.sh:1Panel网站配置向导"
        "fix-deployment.sh:部署问题修复工具"
        "check-deployment.sh:部署状态检查"
    )
    
    echo -e "${CYAN}可用的部署脚本:${NC}"
    for script_info in "${scripts[@]}"; do
        IFS=':' read -r script desc <<< "$script_info"
        if [[ -f "$script" ]]; then
            if [[ -x "$script" ]]; then
                echo -e "   ${GREEN}✅ $script${NC} - $desc"
            else
                echo -e "   ${YELLOW}⚠️  $script${NC} - $desc (需要执行权限)"
            fi
        else
            echo -e "   ${RED}❌ $script${NC} - $desc (文件不存在)"
        fi
    done
}

# 检查Docker配置
check_docker_config() {
    echo -e "${BLUE}🐳 检查Docker配置...${NC}"
    
    # 检查docker-compose.yml
    if [[ -f "docker-compose.yml" ]]; then
        echo -e "${GREEN}✅ docker-compose.yml 存在${NC}"
        
        # 检查端口配置
        local http_port=$(grep -E "^\s*-\s*\"[0-9]+:80\"" docker-compose.yml | sed -E 's/.*"([0-9]+):80".*/\1/')
        local ws_port=$(grep -E "^\s*-\s*\"[0-9]+:8080\"" docker-compose.yml | sed -E 's/.*"([0-9]+):8080".*/\1/')
        
        echo -e "   📋 端口配置:"
        echo -e "      HTTP端口: ${CYAN}$http_port${NC} → 容器80端口"
        echo -e "      WebSocket端口: ${CYAN}$ws_port${NC} → 容器8080端口"
    else
        echo -e "${RED}❌ docker-compose.yml 不存在${NC}"
        return 1
    fi
    
    # 检查Dockerfile
    if [[ -f "Dockerfile" ]]; then
        echo -e "${GREEN}✅ Dockerfile 存在${NC}"
    else
        echo -e "${RED}❌ Dockerfile 不存在${NC}"
        return 1
    fi
}

# 检查当前运行状态
check_current_status() {
    echo -e "${BLUE}📊 检查当前运行状态...${NC}"
    
    # 检查Docker服务
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker未安装${NC}"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker服务未运行${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Docker环境正常${NC}"
    
    # 检查现有容器
    if docker ps -a | grep -q "cannon-game-app"; then
        local status=$(docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep cannon-game-app | awk '{print $2}')
        if docker ps | grep -q "cannon-game-app"; then
            echo -e "${GREEN}✅ 游戏容器正在运行 ($status)${NC}"
        else
            echo -e "${YELLOW}⚠️  游戏容器已停止 ($status)${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  没有发现现有的游戏容器${NC}"
    fi
    
    # 检查端口占用
    local ports_to_check=(3000 8080 80)
    echo -e "   🔌 端口占用检查:"
    for port in "${ports_to_check[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port " || ss -tlnp 2>/dev/null | grep -q ":$port "; then
            echo -e "      端口 $port: ${YELLOW}已占用${NC}"
        else
            echo -e "      端口 $port: ${GREEN}可用${NC}"
        fi
    done
}

# 检查1Panel环境
check_1panel_env() {
    echo -e "${BLUE}🎛️  检查1Panel环境...${NC}"
    
    if command -v 1pctl &> /dev/null; then
        echo -e "${GREEN}✅ 1Panel已安装${NC}"
        
        if pgrep -f "1panel" > /dev/null; then
            echo -e "${GREEN}✅ 1Panel服务运行正常${NC}"
            
            # 获取1Panel访问信息
            local panel_port
            local panel_entrance
            
            if [[ -f "/opt/1panel/conf/app.yaml" ]]; then
                panel_port=$(grep -E "^\s*port:" /opt/1panel/conf/app.yaml | awk '{print $2}' | head -1)
                panel_entrance=$(grep -E "^\s*entrance:" /opt/1panel/conf/app.yaml | awk '{print $2}' | head -1)
            fi
            
            panel_port=${panel_port:-10086}
            local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "您的服务器IP")
            
            echo -e "   📱 1Panel访问信息:"
            if [[ -n "$panel_entrance" ]]; then
                echo -e "      🌐 访问地址: http://${server_ip}:${panel_port}/${panel_entrance}"
            else
                echo -e "      🌐 访问地址: http://${server_ip}:${panel_port}"
            fi
        else
            echo -e "${YELLOW}⚠️  1Panel已安装但未运行${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  1Panel未安装 (可选)${NC}"
    fi
}

# 显示重新部署方案
show_redeployment_options() {
    echo -e "${CYAN}🚀 重新部署方案选择:${NC}"
    echo ""
    
    echo -e "${YELLOW}方案1: 完全重新部署 (推荐)${NC}"
    echo "   适用: 彻底清理后重新开始"
    echo "   命令: ./deploy.sh -c && ./deploy.sh -p"
    echo ""
    
    echo -e "${YELLOW}方案2: 快速重新部署${NC}"
    echo "   适用: 配置没有大变化，快速重启"
    echo "   命令: ./deploy.sh -s && ./deploy.sh -p"
    echo ""
    
    echo -e "${YELLOW}方案3: 零基础一键部署${NC}"
    echo "   适用: 完全不懂技术的用户"
    echo "   命令: ./一键部署.sh"
    echo ""
    
    echo -e "${YELLOW}方案4: 交互式部署${NC}"
    echo "   适用: 需要自定义配置"
    echo "   命令: ./部署助手.sh"
    echo ""
    
    echo -e "${YELLOW}方案5: 端口冲突解决${NC}"
    echo "   适用: 端口被占用需要更换"
    echo "   命令: ./check_ports.sh"
    echo ""
    
    echo -e "${YELLOW}方案6: 1Panel网站配置${NC}"
    echo "   适用: 容器运行但无法访问"
    echo "   命令: ./1panel-website-setup.sh"
    echo ""
}

# 自动修复常见问题
auto_fix_issues() {
    echo -e "${BLUE}🔧 自动修复常见问题...${NC}"
    
    # 修复脚本权限
    local scripts=(*.sh)
    for script in "${scripts[@]}"; do
        if [[ -f "$script" && ! -x "$script" ]]; then
            chmod +x "$script"
            echo -e "${GREEN}✅ 修复 $script 执行权限${NC}"
        fi
    done
    
    # 创建必要目录
    local dirs=("logs" "nginx-logs")
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            echo -e "${GREEN}✅ 创建目录 $dir${NC}"
        fi
    done
    
    # 检查并修复docker配置文件格式
    if [[ -f "docker-compose.yml" ]]; then
        if ! docker-compose config &> /dev/null; then
            echo -e "${RED}❌ docker-compose.yml 格式有误${NC}"
            echo -e "${YELLOW}   建议手动检查YAML格式${NC}"
        else
            echo -e "${GREEN}✅ docker-compose.yml 格式正确${NC}"
        fi
    fi
}

# 生成部署建议
generate_deployment_advice() {
    echo -e "${CYAN}💡 个性化部署建议:${NC}"
    echo ""
    
    # 基于当前状态给出建议
    if docker ps | grep -q "cannon-game-app"; then
        echo -e "${GREEN}当前状态: 游戏容器正在运行${NC}"
        echo "建议操作:"
        echo "1. 如果游戏正常工作，无需重新部署"
        echo "2. 如果需要更新代码: ./deploy.sh -s && ./deploy.sh -p"
        echo "3. 如果无法访问: ./1panel-website-setup.sh"
    else
        echo -e "${YELLOW}当前状态: 游戏容器未运行${NC}"
        echo "建议操作:"
        echo "1. 标准部署: ./deploy.sh -p"
        echo "2. 一键部署: ./一键部署.sh"
        echo "3. 检查端口: ./check_ports.sh"
    fi
    
    echo ""
    
    # 基于环境给出建议
    if command -v 1pctl &> /dev/null; then
        echo -e "${BLUE}1Panel环境建议:${NC}"
        echo "• 确保开放防火墙端口: 3000, 8080"
        echo "• 配置网站反向代理: ./1panel-website-setup.sh"
        echo "• 使用1Panel专用检查: ./1panel-check.sh"
    else
        echo -e "${BLUE}标准Docker环境建议:${NC}"
        echo "• 确保Docker和Docker Compose已安装"
        echo "• 检查端口占用情况"
        echo "• 使用标准部署脚本"
    fi
}

# 交互式重新部署
interactive_redeploy() {
    echo -e "${PURPLE}🎯 交互式重新部署向导${NC}"
    echo ""
    
    echo "请选择重新部署方式:"
    echo "1) 完全重新部署 (清理后重新开始)"
    echo "2) 快速重新部署 (保留数据)"
    echo "3) 零基础一键部署"
    echo "4) 端口冲突检测和修复"
    echo "5) 仅检查状态不部署"
    echo "6) 退出"
    
    read -p "请输入选择 (1-6): " choice
    
    case $choice in
        1)
            echo -e "${YELLOW}执行完全重新部署...${NC}"
            ./deploy.sh -c && ./deploy.sh -p
            ;;
        2)
            echo -e "${YELLOW}执行快速重新部署...${NC}"
            ./deploy.sh -s && ./deploy.sh -p
            ;;
        3)
            echo -e "${YELLOW}执行一键部署...${NC}"
            ./一键部署.sh
            ;;
        4)
            echo -e "${YELLOW}检测端口冲突...${NC}"
            ./check_ports.sh
            ;;
        5)
            echo -e "${BLUE}仅检查状态，不执行部署${NC}"
            if [[ -x "./1panel-check.sh" ]]; then
                ./1panel-check.sh
            else
                ./check-deployment.sh
            fi
            ;;
        6)
            echo -e "${BLUE}退出重新部署向导${NC}"
            return 0
            ;;
        *)
            echo -e "${RED}无效选择，请重新运行脚本${NC}"
            return 1
            ;;
    esac
}

# 主函数
main() {
    show_logo
    
    echo -e "${BLUE}🔍 开始全面检查部署环境...${NC}"
    echo ""
    
    # 执行各项检查
    check_deployment_files
    echo ""
    
    check_deployment_scripts
    echo ""
    
    check_docker_config
    echo ""
    
    check_current_status
    echo ""
    
    check_1panel_env
    echo ""
    
    auto_fix_issues
    echo ""
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    show_redeployment_options
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    generate_deployment_advice
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    
    # 询问是否执行交互式重新部署
    echo ""
    read -p "是否执行交互式重新部署？(y/N): " execute_deploy
    if [[ "$execute_deploy" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo ""
        interactive_redeploy
    else
        echo -e "${BLUE}检查完成。请根据上述建议手动选择部署方案。${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 重新部署检查完成！${NC}"
    echo -e "${CYAN}💡 如有问题，请查看详细文档或运行相应的修复脚本。${NC}"
}

# 执行主函数
main "$@" 