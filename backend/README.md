# OshiCall Backend API

OshiCallのバックエンドAPIサーバー（Express + TypeScript）

## 機能

- Stripe決済統合
- Supabase連携
- オークション決済処理
- Webhook処理

## セットアップ

### 依存関係のインストール

```bash
cd backend
npm install
```

### 環境変数の設定

`.env`ファイルを作成して以下の環境変数を設定：

```bash
PORT=3001
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 開発サーバーの起動

```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

### ビルド

```bash
npm run build
```

### 本番起動

```bash
npm start
```

## API エンドポイント

### Stripe関連

- `POST /api/stripe/create-customer` - Stripe顧客作成
- `POST /api/stripe/create-setup-intent` - カード登録用SetupIntent作成
- `POST /api/stripe/confirm-payment-method` - カード登録確認
- `POST /api/stripe/authorize-payment` - 入札時の与信確保
- `POST /api/stripe/cancel-authorization` - 与信キャンセル
- `POST /api/stripe/capture-payment` - 決済確定（落札時）
- `POST /api/stripe/create-connect-account` - インフルエンサー用Connect Account作成
- `POST /api/stripe/webhook` - Stripe Webhook受信

### ヘルスチェック

- `GET /health` - サーバー稼働確認

## デプロイ

### Heroku

```bash
# Heroku CLIでログイン
heroku login

# アプリを作成
heroku create oshicall-backend

# 環境変数を設定
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key
heroku config:set STRIPE_SECRET_KEY=your-key
heroku config:set STRIPE_WEBHOOK_SECRET=your-secret
heroku config:set FRONTEND_URL=https://your-frontend-url.com

# デプロイ
git subtree push --prefix backend heroku main
```

## セキュリティ

- Service Role Keyは安全に管理してください
- Stripe Secret Keyは絶対に公開しないでください
- WebhookにはStripe署名検証を使用しています
