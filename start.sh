#!/bin/bash
#
# 快速启动脚本 - 用于开发环境
#

echo "🎂 Birthdays Reminder Pro - 开发环境启动"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查依赖
if [[ ! -d "node_modules" ]]; then
    echo ""
    echo "📦 安装依赖..."
    npm install
fi

# 检查数据库
if [[ ! -f "db/birthdays.db" ]]; then
    echo ""
    echo "🗄️ 初始化数据库..."
    mkdir -p db
    npx prisma db push
fi

# 复制环境变量
if [[ ! -f ".env" ]]; then
    echo ""
    echo "📝 创建环境变量..."
    cp .env.example .env
fi

echo ""
echo "🚀 启动开发服务器..."
echo ""
npm run dev
