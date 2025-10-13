# Stripe 連携 ステップバイステップガイド

## 📝 前提条件

- ✅ Stripe アカウント作成済み
- ✅ テストモードで開発
- ✅ バックエンド: Heroku (Node.js)

---

## 🎯 ステップ 1: Stripe API キーの取得と設定

### 1-1. Stripe Dashboard でキーを取得

```
1. https://dashboard.stripe.com/test/apikeys にアクセス
2. 以下をコピー:
   - Publishable key: pk_test_xxxxxxx
   - Secret key: sk_test_xxxxxxx（「Reveal」をクリック）
```

### 1-2. ローカル環境変数の設定（フロントエンド）

`.env` ファイルに追加：

```bash
# 既存の設定
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Stripeを追加
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
```

### 1-3. バックエンド環境変数の設定

`backend/.env` ファイルを作成：

```bash
# Stripe設定
STRIPE_SECRET_KEY=sk_test_xxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxx

# Supabase設定（Service Role Key）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...service_role_key

# フロントエンドURL
FRONTEND_URL=http://localhost:5173

# ポート
PORT=3001
```

**Supabase Service Role Key の取得:**

```
Supabase Dashboard → Settings → API → service_role key（Reveal）
```

### 1-4. Heroku 環境変数の設定

```bash
# フロントエンド（既に設定済み）
heroku config:set VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx

# バックエンド用のHerokuアプリ作成（別途必要）
heroku create oshicall-backend
heroku config:set STRIPE_SECRET_KEY=sk_test_xxxxxxx -a oshicall-backend
heroku config:set SUPABASE_URL=https://xxx.supabase.co -a oshicall-backend
heroku config:set SUPABASE_SERVICE_ROLE_KEY=eyJxxx... -a oshicall-backend
heroku config:set FRONTEND_URL=https://oshicall-xxx.herokuapp.com -a oshicall-backend
```

---

## 🎯 ステップ 2: バックエンドの起動とテスト

### 2-1. ローカルでバックエンドを起動

```bash
cd backend
npm install
npm run dev
```

期待される出力：

```
🚀 Server running on port 3001
```

### 2-2. ヘルスチェック

```bash
curl http://localhost:3001/health
```

期待されるレスポンス：

```json
{ "status": "ok", "timestamp": "2025-10-10T..." }
```

---

## 🎯 ステップ 3: フロントエンド Stripe.js 初期化

### 3-1. Stripe.js のロード確認

`src/lib/stripe.ts` は既に存在しています。確認：

```typescript
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
```

### 3-2. テスト

ブラウザのコンソールで確認：

```javascript
// エラーがないことを確認
```

---

## 🎯 ステップ 4: カード登録モーダルの実装

### 4-1. コンポーネント作成

`src/components/CardRegistrationModal.tsx` を作成（次のステップで実装）

### 4-2. 機能

- Stripe Elements でカード入力
- Setup Intent 処理
- カード情報の保存
- エラーハンドリング

---

## 🎯 ステップ 5: 入札機能の実装

### 5-1. 入札ボタンの実装

TalkDetail ページに：

- カード登録チェック
- 入札モーダル
- 与信確保
- 入札データ保存

### 5-2. 入札 API 呼び出し

```typescript
// 1. カードが登録されているか確認
if (!user.has_payment_method) {
  // カード登録モーダルを表示
}

// 2. 与信確保
const paymentIntent = await authorizePayment(amount, customerId, auctionId);

// 3. 入札データを保存
await createBid(auctionId, userId, amount, paymentIntent.id);
```

---

## 🎯 ステップ 6: Heroku へのデプロイ

### 6-1. バックエンドのデプロイ

```bash
cd backend
git init
heroku git:remote -a oshicall-backend
git add .
git commit -m "Initial backend deployment"
git push heroku main
```

### 6-2. フロントエンドの環境変数更新

```bash
# バックエンドURLを設定
heroku config:set VITE_BACKEND_URL=https://oshicall-backend.herokuapp.com -a oshicall
```

---

## ✅ 完了チェックリスト

### 環境変数

- [ ] ローカル: `.env` に Stripe Publishable Key 設定
- [ ] ローカル: `backend/.env` に Stripe Secret Key 設定
- [ ] Heroku: フロントエンドに環境変数設定
- [ ] Heroku: バックエンドに環境変数設定

### バックエンド

- [ ] `npm run dev` で起動確認
- [ ] `/health` エンドポイントが応答
- [ ] Heroku にデプロイ

### フロントエンド

- [ ] Stripe.js が読み込める
- [ ] バックエンド API に接続できる

---

## 🚀 次のステップ

準備ができたら、以下を実装します：

1. **カード登録モーダル**
2. **入札ボタンの実装**
3. **入札フローの完成**

---

現在、**ステップ 1-2**まで完了しました。

次は**ステップ 1-3: カード登録 UI**を実装しますか？
