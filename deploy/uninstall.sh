#!/bin/bash
#
# Birthdays Reminder Pro - 卸载脚本
# 彻底卸载程序和数据
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

INSTALL_DIR="/opt/birthdays"
DATA_DIR="/opt/birthdays/db"

echo ""
echo "🗑️  Birthdays Reminder Pro 卸载程序"
echo "============================================"
echo ""

# 检查 root 权限
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}错误: 此脚本需要 root 权限${NC}"
    exit 1
fi

# 确认卸载
echo -e "${YELLOW}警告: 此操作将卸载 Birthdays Reminder Pro${NC}"
echo ""
read -p "确认要卸载吗？(y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "取消卸载"
    exit 0
fi

# 是否删除数据
echo ""
read -p "是否同时删除所有数据（生日记录、配置等）？(y/N): " del_data

# 停止服务
echo ""
echo "停止服务..."
systemctl stop birthdays 2>/dev/null || true
systemctl disable birthdays 2>/dev/null || true

# 删除服务文件
echo "删除 systemd 服务..."
rm -f /etc/systemd/system/birthdays.service
systemctl daemon-reload

# 删除 CLI 命令
echo "删除 CLI 命令..."
rm -f /usr/local/bin/birthday

# 删除安装目录
echo "删除程序文件..."
if [[ "$del_data" == "y" || "$del_data" == "Y" ]]; then
    rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}✅ 已删除所有数据和程序文件${NC}"
else
    # 保留数据目录
    if [[ -d "$DATA_DIR" ]]; then
        BACKUP_DIR="/root/birthdays_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r "$DATA_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
        echo -e "${GREEN}✅ 数据已备份到: $BACKUP_DIR${NC}"
    fi
    rm -rf "$INSTALL_DIR"
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 Birthdays Reminder Pro 已完全卸载${NC}"
echo "============================================"
echo ""
