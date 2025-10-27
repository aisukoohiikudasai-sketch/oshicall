#!/bin/bash

# 環境切り替えスクリプト
# 使用方法: ./scripts/switch-env.sh [dev|staging]

ENV=${1:-dev}

if [ "$ENV" = "dev" ]; then
    echo "🔄 Development環境に切り替え中..."
    cp env.dev.example .env
    echo "✅ Development環境が設定されました"
elif [ "$ENV" = "staging" ]; then
    echo "🔄 Staging環境に切り替え中..."
    cp env.staging.example .env
    echo "✅ Staging環境が設定されました"
else
    echo "❌ 無効な環境: $ENV"
    echo "使用方法: $0 [dev|staging]"
    exit 1
fi

echo "📋 現在の設定:"
echo "SUPABASE_URL: $(grep SUPABASE_URL .env | cut -d'=' -f2)"
