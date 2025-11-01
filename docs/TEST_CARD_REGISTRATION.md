# カード登録テストガイド

## ✅ 準備完了

- ✅ バックエンドサーバー起動中（http://localhost:3001）
- ✅ Stripe API キー設定済み
- ✅ Supabase 接続確認済み

---

## 🧪 テスト手順

### 1. バックエンドログを確認しながらテスト

別のターミナルでログを監視：

```bash
tail -f /tmp/backend.log
```

### 2. ブラウザでテスト

1. http://localhost:5173/ を開く
2. F12 で開発者ツールを開く
3. **Console**タブと**Network**タブを両方開く
4. Talk 枠をクリック
5. 入札ボタン（+¥10）をクリック
6. カード登録モーダルが表示される

### 3. テストカード情報を入力

```
カード番号: 4242 4242 4242 4242
有効期限: 12/34
CVC: 123
ZIP: 12345
```

### 4. 「カードを登録」をクリック

---

## 🔍 デバッグ情報の確認

### Console タブで確認すること

- エラーメッセージ
- API 呼び出しのログ
- Stripe.js 関連のエラー

### Network タブで確認すること

失敗したリクエストをクリックして：

1. **General**

   - Request URL: `http://localhost:3001/api/stripe/...` になっているか
   - Status Code: 200 以外の場合は何か

2. **Headers**

   - Content-Type: application/json になっているか

3. **Payload**

   - 送信されたデータ

4. **Response**
   - エラーメッセージの詳細

---

## 💡 よくあるエラーと対処法

### エラー 1: `Invalid API Key provided`

**原因**: Stripe のテストキーが正しく設定されていない

**確認**:

```bash
# バックエンドの環境変数を確認
cat backend/.env | grep STRIPE_SECRET_KEY
```

**対処法**:

```bash
# バックエンドを再起動
pkill -f "ts-node src/server.ts"
cd backend && npm run dev
```

### エラー 2: `Failed to fetch`

**原因**: バックエンドサーバーが起動していない、または CORS エラー

**確認**:

```bash
# バックエンドが起動しているか確認
curl http://localhost:3001/health
```

**対処法**:

```bash
# バックエンドを起動
cd backend && npm run dev
```

### エラー 3: `CORS policy`

**原因**: CORS の設定が間違っている

**確認**:

- バックエンドの CORS 設定を確認
- `backend/src/server.ts` の `cors({ origin: ... })` 部分

### エラー 4: `Stripe customer not found`

**原因**: Stripe 顧客がまだ作成されていない

**対処法**:

- 一度ログアウトして、再度ログインしてから試す

---

## 🎯 成功時の流れ

1. ユーザーがカード情報を入力
2. Stripe.js がカード情報を検証
3. Setup Intent が作成される
4. Stripe にカード情報が送信される
5. Supabase に`has_payment_method: true`が保存される
6. モーダルが閉じる
7. 自動的に入札が実行される
8. 「✅ ¥xxx で入札しました！」メッセージ表示

---

## 📝 現在のステータス

```
✅ バックエンドAPI: 動作確認済み
✅ Stripe接続: テスト成功
⏳ フロントエンド統合: テスト中
```

次回エラーが出た場合は、以下の情報を教えてください：

1. Console タブのエラーメッセージ
2. Network タブの失敗したリクエストの URL
3. Response タブのエラー内容
