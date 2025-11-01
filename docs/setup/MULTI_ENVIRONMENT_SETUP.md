# 複数 Supabase 環境の設定ガイド

## 概要

Dev 環境と Staging 環境の 2 つの Supabase プロジェクトを MCP で管理するための設定方法です。

## 環境構成

### Dev 環境

- **URL**: `https://bpmarxvgryqhjfmqqdlg.supabase.co`
- **用途**: 開発・テスト用

### Staging 環境

- **URL**: `https://wioealhsienyubwegvdu.supabase.co`
- **用途**: 本番前の最終テスト用

## 設定手順

### 1. Cursor MCP 設定

1. **Cursor の設定を開く** (Cmd+, または Cursor > Preferences)
2. **MCP 設定セクション**を探す
3. **`mcp-config.example.json` の内容をコピー**して設定に貼り付け
4. **Cursor を再起動**

### 2. 環境切り替え

```bash
# Development環境に切り替え
./scripts/switch-env.sh dev

# Staging環境に切り替え
./scripts/switch-env.sh staging
```

### 3. 現在の接続環境確認

MCP 経由で現在接続されているプロジェクトを確認：

- Dev 環境: `https://bpmarxvgryqhjfmqqdlg.supabase.co`
- Staging 環境: `https://wioealhsienyubwegvdu.supabase.co`

## ファイル構成

```
├── mcp-config.example.json    # MCP設定テンプレート
├── env.dev.example           # Dev環境設定
├── env.staging.example       # Staging環境設定
├── scripts/switch-env.sh     # 環境切り替えスクリプト
└── MULTI_ENVIRONMENT_SETUP.md # このファイル
```

## 注意事項

- 環境変数ファイル (`.env`) は `.gitignore` に含まれているため、実際の設定は手動で行う必要があります
- MCP 設定を変更した後は、Cursor の再起動が必要です
- 本番環境のキーは絶対に公開リポジトリにコミットしないでください

## トラブルシューティング

### MCP 接続エラー

1. Cursor を再起動
2. MCP 設定の構文を確認
3. プロジェクト URL とキーが正しいか確認

### 環境切り替えが反映されない

1. `.env` ファイルが正しく作成されているか確認
2. アプリケーションを再起動
3. ブラウザのキャッシュをクリア

