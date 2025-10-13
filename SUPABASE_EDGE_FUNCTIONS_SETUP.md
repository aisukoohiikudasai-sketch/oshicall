# Supabase Edge Functions セットアップガイド

## 🎯 オークション終了処理の自動化

Supabase Edge Functionsを使って、オークション終了時に自動的に決済を確定します。

---

## 📋 前提条件

- ✅ Supabase CLIがインストール済み
- ✅ Supabaseプロジェクトにログイン済み

---

## 🛠️ セットアップ手順

### ステップ1: Supabase CLIのインストール

```bash
# Homebrewでインストール（Mac）
brew install supabase/tap/supabase

# または、npm経由
npm install -g supabase
```

### ステップ2: Supabaseにログイン

```bash
supabase login
```

ブラウザが開くので、Supabaseアカウントでログインしてください。

### ステップ3: プロジェクトをリンク

```bash
# プロジェクトルートで実行
supabase link --project-ref your-project-id
```

### ステップ4: Edge Functionをデプロイ

```bash
# finalize-auctions関数をデプロイ
supabase functions deploy finalize-auctions
```

### ステップ5: シークレット（環境変数）を設定

```bash
# Stripe Secret Keyを設定
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here

# 確認
supabase secrets list
```

### ステップ6: Cron jobを設定

Supabase Dashboardで設定：

1. https://app.supabase.com/project/your-project-id/database/cron-jobs を開く
2. 「Create a new cron job」をクリック
3. 以下を設定：

```
Name: finalize-auctions
Schedule: */1 * * * * (毎分実行)
SQL Command:
```

```sql
SELECT
  net.http_post(
    url:='https://your-project-id.supabase.co/functions/v1/finalize-auctions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
```

4. 「Save」をクリック

---

## 🧪 テスト

### 手動でEdge Functionを実行

```bash
# ローカルテスト
supabase functions serve finalize-auctions

# 別のターミナルで
curl -X POST 'http://localhost:54321/functions/v1/finalize-auctions' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### 本番環境でテスト

```bash
curl -X POST 'https://your-project-id.supabase.co/functions/v1/finalize-auctions' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

---

## 📊 動作確認

### Edge Functionのログを確認

Supabase Dashboard → Edge Functions → finalize-auctions → Logs

期待されるログ：
```
🔵 オークション終了処理開始
🔵 1件のオークションを処理します
🔵 オークション処理: auction_xxx
🔵 最高入札: ¥10000 by user_xxx
🔵 Payment Intent Capture: pi_xxx
✅ 決済確定成功: ¥10000
✅ purchased_slots記録成功: purchased_xxx
✅ payment_transactions記録成功
✅ オークション終了処理完了
```

---

## 🔧 トラブルシューティング

### エラー: `Deno.env.get is not a function`

**原因**: ローカルテスト時の環境変数

**解決策**:
```bash
# .env.localファイルを作成
echo "STRIPE_SECRET_KEY=sk_test_xxx" > supabase/functions/.env.local
```

### エラー: `stripe is not defined`

**原因**: Stripe SDKのインポート失敗

**解決策**: 
`index.ts`のインポート文を確認

---

## 📚 関連ファイル

- `supabase/functions/finalize-auctions/index.ts` - Edge Function本体
- `supabase_rpc_functions.sql` - RPC関数（統計更新）
- `STRIPE_AUTHORIZATION_COMPLETE.md` - Stripe与信管理

---

## 🎯 次のステップ

1. Supabase CLIをインストール
2. プロジェクトをリンク
3. Edge Functionをデプロイ
4. Cron jobを設定
5. テスト実行

---

準備ができたら、次のステップに進んでください！

