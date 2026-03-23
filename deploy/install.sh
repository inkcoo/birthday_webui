#!/bin/bash
#
# Birthdays Reminder Pro - 一键安装脚本
# 支持 Ubuntu/Debian/CentOS/RHEL 等 Linux 系统
#
# 使用方法:
#   curl -fsSL https://raw.githubusercontent.com/inkcoo/birthdays_reminder/main/deploy/install.sh | bash
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 版本信息
VERSION="1.0.1"
INSTALL_DIR="/opt/birthdays"
DATA_DIR="/opt/birthdays/data"
LOG_DIR="/opt/birthdays/logs"
REPO_URL="https://github.com/inkcoo/birthdays_reminder.git"

# 检测操作系统
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [[ -f /etc/redhat-release ]]; then
        OS="centos"
        OS_VERSION="7"
    else
        error "不支持的操作系统"
    fi
    info "检测到操作系统: $OS $OS_VERSION"
}

# 检查 root 权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "此脚本需要 root 权限，请使用 sudo 运行"
    fi
}

# 安装依赖
install_deps() {
    info "安装系统依赖..."
    
    case $OS in
        ubuntu|debian)
            apt-get update -qq
            apt-get install -y -qq curl wget git xz-utils
            ;;
        centos|rhel)
            yum install -y -q curl wget git xz
            ;;
        rocky|almalinux)
            yum install -y -q curl wget git xz
            ;;
        *)
            warn "未知系统类型，跳过依赖安装"
            ;;
    esac
    
    success "系统依赖安装完成"
}

# 检查并安装 Node.js
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 18 ]]; then
            info "Node.js 版本: $(node -v)"
            return 0
        fi
    fi
    
    # 检测 CentOS 7，需要使用预编译版本
    if [[ "$OS" == "centos" || "$OS" == "rhel" ]] && [[ "$OS_VERSION" == "7"* ]]; then
        warn "检测到 CentOS/RHEL 7，使用预编译 Node.js..."
        install_node_binary
        return 0
    fi
    
    info "安装 Node.js 20.x..."
    
    case $OS in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y -qq nodejs
            ;;
        rocky|almalinux)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y -q nodejs
            ;;
        centos|rhel)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y -q nodejs
            ;;
    esac
    
    success "Node.js 安装完成: $(node -v)"
}

# 安装预编译的 Node.js（适用于 CentOS 7 等旧系统）
install_node_binary() {
    info "下载预编译 Node.js 20.x..."
    
    # 确定 CPU 架构
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            NODE_ARCH="x64"
            ;;
        aarch64)
            NODE_ARCH="arm64"
            ;;
        *)
            error "不支持的 CPU 架构: $ARCH"
            ;;
    esac
    
    # Node.js 版本
    NODE_VERSION="20.18.0"
    NODE_FILE="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_FILE}"
    
    # 下载
    cd /tmp
    wget -q "$NODE_URL" || error "Node.js 下载失败"
    
    # 解压到 /usr/local
    tar -xf "$NODE_FILE" -C /usr/local --strip-components=1
    
    # 清理
    rm -f "$NODE_FILE"
    
    # 验证
    if ! command -v node &> /dev/null; then
        error "Node.js 安装失败"
    fi
    
    success "Node.js 安装完成: $(node -v)"
}

# 创建目录
create_dirs() {
    info "创建安装目录..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$LOG_DIR"
    success "目录创建完成"
}

# 克隆仓库
clone_repo() {
    info "克隆代码仓库..."
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        info "代码已存在，拉取最新版本..."
        cd "$INSTALL_DIR"
        git pull
    else
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    success "代码克隆完成"
}

# 安装 npm 依赖
install_npm_deps() {
    info "安装 npm 依赖..."
    cd "$INSTALL_DIR"
    
    # 使用 npm 安装
    npm install
    
    success "npm 依赖安装完成"
}

# 初始化数据库
init_database() {
    info "初始化数据库..."
    cd "$INSTALL_DIR"
    
    # 创建数据目录
    mkdir -p db
    
    # 设置环境变量
    export DATABASE_URL="file:./db/birthdays.db"
    
    # 同步数据库
    npx prisma generate
    npx prisma db push
    
    success "数据库初始化完成"
}

# 构建应用
build_app() {
    info "构建应用程序..."
    cd "$INSTALL_DIR"
    
    npm run build
    
    success "应用构建完成"
}

# 创建环境文件
create_env_file() {
    info "创建环境配置..."
    
    # 生成随机密钥
    RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    
    cat > "$INSTALL_DIR/.env" << EOF
# 数据库
DATABASE_URL=file:./db/birthdays.db

# JWT 密钥
JWT_SECRET=$RANDOM_SECRET

# 环境
NODE_ENV=production
EOF
    
    success "环境配置创建完成"
}

# 创建启动脚本
create_start_script() {
    info "创建启动脚本..."
    
    cat > "$INSTALL_DIR/start.sh" << 'EOF'
#!/bin/bash
cd /opt/birthdays
export NODE_ENV=production
export DATABASE_URL=file:./db/birthdays.db
exec node .next/standalone/server.js
EOF
    
    chmod +x "$INSTALL_DIR/start.sh"
    success "启动脚本创建完成"
}

# 安装 systemd 服务
install_service() {
    info "安装 systemd 服务..."
    
    cat > /etc/systemd/system/birthdays.service << EOF
[Unit]
Description=Birthday Reminder Pro - Enterprise Birthday Reminder System
Documentation=https://github.com/inkcoo/birthdays_reminder
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/birthdays
ExecStart=/opt/birthdays/start.sh
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=5s

# Environment
Environment=NODE_ENV=production
Environment=DATABASE_URL=file:/opt/birthdays/db/birthdays.db

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=birthdays

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable birthdays
    
    success "systemd 服务安装完成"
}

# 安装 CLI 命令
install_cli() {
    info "安装 CLI 命令..."
    
    cat > /usr/local/bin/birthday << 'EOFCLI'
#!/bin/bash
# Birthday Reminder Pro CLI Tool

INSTALL_DIR="/opt/birthdays"
DATA_DIR="/opt/birthdays/db"

show_help() {
    echo "🎂 Birthday Reminder Pro CLI Tool"
    echo ""
    echo "用法: birthday [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  status      查看服务状态"
    echo "  start       启动服务"
    echo "  stop        停止服务"
    echo "  restart     重启服务"
    echo "  logs        查看日志 (-f 实时跟踪)"
    echo "  port        修改服务端口"
    echo "  password    重置管理员密码"
    echo "  backup      备份数据库"
    echo "  restore     从备份恢复"
    echo "  uninstall   卸载程序"
    echo "  help        显示帮助信息"
    echo ""
}

case "$1" in
    status)
        systemctl status birthdays --no-pager
        ;;
    start)
        systemctl start birthdays
        echo "✅ 服务已启动"
        ;;
    stop)
        systemctl stop birthdays
        echo "⏹️  服务已停止"
        ;;
    restart)
        systemctl restart birthdays
        echo "🔄 服务已重启"
        ;;
    logs)
        if [[ "$2" == "-f" ]]; then
            journalctl -u birthdays -f
        else
            journalctl -u birthdays -n 100 --no-pager
        fi
        ;;
    backup)
        BACKUP_FILE="$HOME/birthdays_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$BACKUP_FILE" -C "$INSTALL_DIR" db/
        echo "✅ 备份完成: $BACKUP_FILE"
        ;;
    restore)
        if [[ -z "$2" ]]; then
            echo "请指定备份文件: birthday restore <文件>"
            exit 1
        fi
        systemctl stop birthdays
        tar -xzf "$2" -C "$INSTALL_DIR"
        systemctl start birthdays
        echo "✅ 恢复完成"
        ;;
    uninstall)
        /opt/birthdays/deploy/uninstall.sh
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac
EOFCLI
    
    chmod +x /usr/local/bin/birthday
    success "CLI 命令安装完成: birthday"
}

# 创建卸载脚本
create_uninstall_script() {
    info "创建卸载脚本..."
    
    cat > "$INSTALL_DIR/uninstall.sh" << 'EOFUNINSTALL'
#!/bin/bash
set -e

echo "🗑️  正在卸载 Birthdays Reminder Pro..."

# 停止服务
systemctl stop birthdays 2>/dev/null || true
systemctl disable birthdays 2>/dev/null || true

# 删除服务文件
rm -f /etc/systemd/system/birthdays.service
systemctl daemon-reload

# 删除 CLI 命令
rm -f /usr/local/bin/birthday

# 询问是否删除数据
read -p "是否删除所有数据？(y/N): " del_data
if [[ "$del_data" == "y" || "$del_data" == "Y" ]]; then
    rm -rf /opt/birthdays
    echo "✅ 所有数据已删除"
else
    echo "📦 数据保留在: /opt/birthdays/db"
fi

echo "✅ 卸载完成"
EOFUNINSTALL
    
    chmod +x "$INSTALL_DIR/uninstall.sh"
    success "卸载脚本创建完成"
}

# 获取服务器 IP
get_server_ip() {
    local IP
    IP=$(curl -s ifconfig.me 2>/dev/null) || \
    IP=$(hostname -I | awk '{print $1}') || \
    IP="localhost"
    echo "$IP"
}

# 显示安装完成信息
show_complete() {
    local IP=$(get_server_ip)
    local PORT="3000"
    
    echo ""
    echo "============================================"
    echo -e "${GREEN}🎉 Birthdays Reminder Pro 安装完成！${NC}"
    echo "============================================"
    echo ""
    echo -e "🌐 访问地址: ${BLUE}http://${IP}:${PORT}${NC}"
    echo ""
    echo "📝 首次使用请访问 WebUI 进行初始化设置"
    echo ""
    echo "⚙️  管理命令:"
    echo "   birthday status    - 查看状态"
    echo "   birthday restart   - 重启服务"
    echo "   birthday logs -f   - 实时日志"
    echo "   birthday --help    - 查看所有命令"
    echo ""
    echo "📂 安装目录: $INSTALL_DIR"
    echo "📂 数据目录: $INSTALL_DIR/db"
    echo ""
}

# 启动服务
start_service() {
    info "启动服务..."
    systemctl start birthdays
    sleep 2
    
    if systemctl is-active --quiet birthdays; then
        success "服务启动成功"
    else
        warn "服务启动失败，请检查日志: birthday logs"
    fi
}

# 主函数
main() {
    echo ""
    echo "🎂 Birthdays Reminder Pro 安装程序 v$VERSION"
    echo "============================================"
    echo ""
    
    check_root
    detect_os
    install_deps
    check_node
    create_dirs
    clone_repo
    install_npm_deps
    create_env_file
    init_database
    build_app
    create_start_script
    install_service
    install_cli
    create_uninstall_script
    start_service
    show_complete
}

# 运行安装
main "$@"
