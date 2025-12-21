#!/bin/bash

# 舞社管理系统 - 静态托管部署脚本

echo "📦 开始构建生产版本..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 构建失败，请检查错误信息"
  exit 1
fi

echo "✅ 构建成功！"
echo ""
echo "🚀 开始部署到云开发静态托管..."

# 检查是否安装了 cloudbase CLI
if ! command -v cloudbase &> /dev/null
then
    echo "⚠️  未安装 @cloudbase/cli"
    echo "   正在安装..."
    npm install -g @cloudbase/cli
fi

# 部署到静态托管
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 部署完成！"
  echo ""
  echo "访问地址："
  echo "  根路径: https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/"
  echo "  测试页: https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test"
  echo ""
  echo "⚠️  如果访问 /cloud-test 出现 404，请在云控制台配置："
  echo "   静态网站托管 → 设置 → 基础配置 → 错误文档: index.html"
else
  echo "❌ 部署失败"
  exit 1
fi
