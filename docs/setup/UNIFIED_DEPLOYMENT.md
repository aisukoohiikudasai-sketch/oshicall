# 🎯 統合デプロイメントガイド

## ✅ 実装完了：フロントエンド + バックエンドの統合

バックエンドとフロントエンドを**1 つの Heroku アプリ**に統合しました。

---

## 📦 アーキテクチャ

### 統合後の構成

```
oshicall (Herokuアプリ)
  ├── Express サーバー (Node.js)
  │   ├── /api/* → APIエンドポイント
  │   └── /* → 静的ファイル (React)
  │
  ├── dist/ (ビルド済みReact)
  └── backend/dist/ (ビルド済みExpress)
```

### リクエストフロー

#### ローカル開発環境

```
フロントエンド: http://localhost:5173 (Vite)
  ↓ CORS経由
バックエンド: http://localhost:3001 (Express)
```

#### 本番環境（Heroku）

```
https://oshicall-xxx.herokuapp.com
  ├── /api/* → Express APIサーバー
  └── /* → React SPA (静的ファイル)
```

---

## 🛠️ ローカル開発

### 1. バックエンドを起動（ターミナル 1）

```bash
npm run dev:server
```

期待される出力：

```
🚀 Server running on port 3001
📂 Environment: development
```

### 2. フロントエンドを起動（ターミナル 2）

```bash
npm run dev
```

期待される出力：

```
VITE v5.4.2  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 3. テスト

```
1. http://localhost:5173/ を開く
2. Talk枠をクリック
3. 入札ボタンをクリック
4. ✅ APIがlocalhost:3001に接続される
```

---

## 🚀 Heroku デプロイ

### 必要な環境変数

**1 つの Heroku アプリ（oshicall）に設定:**

```bash
# Supabase設定
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe設定（テストモード）
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY

# バックエンドURL（本番では不要、空にする）
VITE_BACKEND_URL=

# バックエンド環境変数
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=https://your-project.supabase.co
FRONTEND_URL=https://your-app.herokuapp.com
```

### Heroku コマンド

```bash
# 既存のアプリに環境変数を追加
heroku config:set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY -a oshicall

heroku config:set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY -a oshicall

heroku config:set FRONTEND_URL=https://oshicall-2936440db16b.herokuapp.com -a oshicall

heroku config:set VITE_BACKEND_URL= -a oshicall

# 確認
heroku config -a oshicall
```

### デプロイ

```bash
git add -A
git commit -m "Unified frontend and backend deployment"
git push heroku main
```

### ビルドプロセス

Heroku は自動的に以下を実行：

1. `npm install` - 依存関係インストール
2. `heroku-postbuild` 実行:
   - 環境変数チェック
   - `vite build` → `dist/` 作成
   - `cd backend && npm run build` → `backend/dist/` 作成
3. `npm start` 実行:
   - `NODE_ENV=production node backend/dist/server.js`
   - Express サーバーが起動
   - `/api/*` → API として処理
   - `/*` → `dist/index.html` を返す

---

## 🔍 動作確認

### 本番環境でのテスト

```bash
# ヘルスチェック
curl https://oshicall-2936440db16b.herokuapp.com/health

# 期待される出力
{"status":"ok","timestamp":"2025-10-10T..."}
```

### ブラウザでテスト

```
1. https://oshicall-2936440db16b.herokuapp.com/ を開く
2. Talk枠をクリック
3. 入札ボタンをクリック
4. ✅ 同じドメインの /api/stripe/* にリクエスト
```

---

## 📊 メリット

### シンプルな構成

- ✅ 1 つの Heroku アプリのみ
- ✅ 環境変数の一元管理
- ✅ CORS の問題なし（同一オリジン）

### コスト削減

- ✅ 1 つの dyno で済む
- ✅ 追加の Heroku アプリ不要

### デプロイの簡略化

- ✅ 1 回のデプロイで完結
- ✅ バージョン管理が容易

---

## 🐛 トラブルシューティング

### エラー: `Cannot GET /api/stripe/...`

**原因**: バックエンドサーバーが起動していない

**解決策**:

```bash
# ログ確認
heroku logs --tail -a oshicall

# 再デプロイ
git push heroku main
```

### エラー: `404 Not Found` for static files

**原因**: ビルドが失敗している

**解決策**:

```bash
# ビルドログ確認
heroku logs --tail -a oshicall | grep "heroku-postbuild"

# ローカルでビルドテスト
npm run build
```

### エラー: CORS policy

**原因**: `VITE_BACKEND_URL`が設定されている

**解決策**:

```bash
# Herokuで空に設定
heroku config:set VITE_BACKEND_URL= -a oshicall
```

---

## 📚 ファイル構成

```
oshicall/
├── src/                    # React フロントエンド
├── backend/
│   ├── src/
│   │   └── server.ts       # Express サーバー
│   ├── dist/               # ビルド済みバックエンド
│   └── package.json
├── dist/                   # ビルド済みフロントエンド
├── package.json            # ルート（統合スクリプト）
├── Procfile                # web: npm start
└── .env                    # ローカル環境変数
```

---

## ✅ 完了チェックリスト

### ローカル開発

- [x] バックエンドが起動する (`npm run dev:server`)
- [x] フロントエンドが起動する (`npm run dev`)
- [x] API リクエストが成功する

### Heroku 本番環境

- [ ] 環境変数を設定
- [ ] デプロイ成功
- [ ] ヘルスチェックが通る (`/health`)
- [ ] フロントエンドが表示される
- [ ] 入札機能が動作する

---

これで、1 つの Heroku アプリでフロントエンドとバックエンドの両方が動きます！🎉
