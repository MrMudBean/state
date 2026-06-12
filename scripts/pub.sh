#!/bin/bash

# 严格模式：任何错误、未定义变量、管道失败都退出
set -euo pipefail

# 颜色输出（可选，但好看）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
CHECK_VERSION="@qqi/check-version"
TAG=""

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. 版本校验
log_info "检查版本...."

if ! TAG=$(npx --yes "${CHECK_VERSION}" c=. 2>&1); then
    log_error "未通过版本校验：${TAG}"
    exit 1
fi
log_info "获取发布标签为 ${TAG}"

# 2. 依赖安装
log_info "安装依赖..."
pnpm install --frozen-lockfile --prod=false

# 3. 构建项目
if ! pnpm run build; then 
  log_error "构建失败" 
  exit 1
fi

# 4. 切换到构建目录
if [[ ! -d "dist" ]]; then 
  log_error "未找到 dist 构建码"
  exit 1
fi


# 5. 检测当前 npm 配置（调试用）
log_info "检测 npm 配置"

npm config list  # 检查当前配置

log_info "Registry: $(npm config get registry)"
# 注意：OIDC 模式下不应有 _authToken，这里只是检查
log_info "Auth token: $(npm config get //registry.npmjs.org/:_authToken || echo 'NOT SET')"

# 6. 进入 dist 并发布
cd "dist"
log_info "开始在 dist 目录下进行发布"
log_info "开始发布 npm 包 ${TAG} 版本"

# 使用 --provenance 和 --access public
# 注意：--no-git-checks 适用于非 git 仓库或特殊情况
if pnpm publish --provenance --access public --tag "${TAG}" --no-git-checks; then
    log_info "🚀🚀  发布成功，完结 🎉🎉 撒花 🎉🎉"
    echo "::notice title=Publish Success::Package published at $(date)"
else 
    log_error "💥 发布 😔 失败 💔 " 
    exit 1
fi

