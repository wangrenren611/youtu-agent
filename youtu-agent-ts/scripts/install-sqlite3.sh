#!/bin/bash

# SQLite3 安装脚本
# 用于解决 sqlite3 模块编译问题

echo "🔧 正在安装 SQLite3 模块..."

# 检查是否安装了必要的构建工具
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 需要安装 Python 3"
    echo "请先安装 Python 3，然后重新运行此脚本"
    exit 1
fi

if ! command -v make &> /dev/null; then
    echo "❌ 错误: 需要安装 make 工具"
    echo "请先安装 Xcode Command Line Tools: xcode-select --install"
    exit 1
fi

# 清理现有的 sqlite3 模块
echo "🧹 清理现有的 sqlite3 模块..."
pnpm remove sqlite3

# 重新安装 sqlite3
echo "📦 重新安装 sqlite3 模块..."
pnpm add sqlite3

# 检查安装是否成功
if [ $? -eq 0 ]; then
    echo "✅ SQLite3 模块安装成功！"
    echo ""
    echo "现在你可以运行数据库示例："
    echo "  npm run example:database"
else
    echo "❌ SQLite3 模块安装失败"
    echo ""
    echo "可能的解决方案："
    echo "1. 确保已安装 Xcode Command Line Tools:"
    echo "   xcode-select --install"
    echo ""
    echo "2. 尝试使用 npm 而不是 pnpm:"
    echo "   npm install sqlite3"
    echo ""
    echo "3. 或者使用其他数据库："
    echo "   export DATABASE_URL='postgresql://user:pass@localhost/db'"
fi


