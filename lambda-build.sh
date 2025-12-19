#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Environment parameter is required! Please use: ./lambda-build.sh [development|production|test]"
    exit 1
fi

set -euo pipefail

ENV=$1
ENV_FILE=".env.$ENV"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE does not exist!"
    exit 1
fi

# 清理旧的构建文件
echo "🧹 Cleaning up old build files..."

rm -rf dist/
rm -rf .aws-sam/
rm -rf layer/

# 创建必要的目录
mkdir -p dist/
mkdir -p layer/nodejs

# 复制 lockfile 以确保生产依赖安装可复现
cp yarn.lock layer/nodejs/
cp package.json layer/nodejs/
# 复制 Prisma schema，确保生成的客户端落在 layer 目录
cp -r prisma layer/nodejs/

# 使用webpack构建应用
echo "🏗️ Building application with webpack..."
yarn run build

# 设置 Lambda Layer
# echo "📦 Setting up Lambda layer..."
# cat > layer/nodejs/package.json << EOF
# {
#   "dependencies": {
#     "awilix": "^12.0.5",
#     "awilix-koa": "^11.1.0",
#     "co": "^4.6.0",
#     "koa": "^3.0.0",
#     "koa-router": "^13.0.1",
#     "koa-static": "^5.0.0",
#     "koa-swig": "^2.2.1",
#     "koa2-connect-history-api-fallback": "^0.1.3",
#     "lodash": "^4.17.21",
#     "module-alias": "^2.2.3",
#     "serverless-http": "^3.2.0"
#   }
# }
# EOF

# 在layer中安装依赖
cd layer/nodejs
echo "📦 Installing layer dependencies..."
yarn install --production --frozen-lockfile

echo "🛠 Generating Prisma Client into layer..."
../../node_modules/.bin/prisma generate --schema ./prisma/schema.prisma
# Prisma 生成后不再需要 schema 目录，可选清理
rm -rf prisma

# 确认 Prisma Client 已生成到 layer（否则直接失败）
if [ ! -f node_modules/.prisma/client/default.js ]; then
    echo "❌ Prisma client was not generated into layer/nodejs/node_modules/.prisma/client"
    exit 1
fi

echo "📊 Final layer size:"
du -sh node_modules/
cd ../../


# 执行 sam build 和部署
echo "🚀 Running sam build..."
sam build --skip-pull-image

if [ $? -eq 0 ]; then
    if [ "$ENV" = "production" ] || [ "$ENV" = "test" ]; then
        echo "🚀 Deploying to production..."
        sam deploy -g
    else
        echo "🌍 Starting local API..."
        sam local start-api --warm-containers EAGER
    fi
else
    echo "❌ Sam build failed!"
    exit 1
fi
