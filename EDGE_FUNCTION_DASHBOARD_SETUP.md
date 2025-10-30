# Edge Function Dashboardセットアップガイド

Supabase CLIなしで、Dashboardから直接Edge Functionをデプロイする手順です。

## 📋 準備完了しているもの

✅ Resend APIキー: `re_5dwz19Je_N8kL15s134R2xbbHGXigybgr`
✅ SQLマイグレーション: 実行済み
✅ フロントエンドコード: ビルド済み
✅ Edge Functionコード: 統合版作成済み

## 🎯 ステップ1: Supabase環境変数の設定

### 1. Dashboardにアクセス

1. [Supabase Dashboard](https://app.supabase.com/) を開く
2. プロジェクトを選択
3. 左メニューから **Project Settings** （歯車アイコン）をクリック
4. **Edge Functions** タブをクリック

### 2. 環境変数を追加

**Add secret** ボタンをクリックして、以下の3つを追加：

#### 変数1: RESEND_API_KEY
```
Name: RESEND_API_KEY
Value: re_5dwz19Je_N8kL15s134R2xbbHGXigybgr
```
**Save** をクリック

#### 変数2: FROM_EMAIL
```
Name: FROM_EMAIL
Value: OshiTalk <noreply@oshicall.com>
```
**Save** をクリック

#### 変数3: APP_URL
```
Name: APP_URL
Value: https://oshicall-2936440db16b.herokuapp.com
```
**Save** をクリック

⚠️ **開発環境の場合**: `APP_URL` を `http://localhost:5173` に変更

### 3. 確認

Environment Variablesセクションに以下の3つが表示されているか確認：
- ✅ RESEND_API_KEY
- ✅ FROM_EMAIL
- ✅ APP_URL

## 🎯 ステップ2: Edge Functionのデプロイ

### 方法A: Supabase Dashboard（簡易版）

⚠️ **注意**: Dashboardからの直接デプロイは現在制限されている可能性があります。
推奨は方法Bです。

1. 左メニューから **Edge Functions** をクリック
2. **Create a new function** をクリック
3. Function nameに `notify-new-talk-slot` と入力
4. エディタに `notify-new-talk-slot-standalone.ts` の内容を貼り付け
5. **Deploy** をクリック

### 方法B: GitHub経由でデプロイ（推奨）

SupabaseプロジェクトをGitHubと連携している場合：

1. コードをGitHubにpush
2. Supabase Dashboard → **Edge Functions** → **Deploy from GitHub** を選択
3. リポジトリとブランチを選択
4. 自動デプロイが実行される

### 方法C: Supabase CLI経由（ローカル）

⚠️ 現在CLIがインストールできない場合はスキップしてください

```bash
# ローカルでビルド
supabase functions deploy notify-new-talk-slot
```

## 🎯 ステップ3: Database Webhookの設定

### 1. Webhookを作成

1. Supabase Dashboard を開く
2. 左メニューから **Database** → **Webhooks** をクリック
3. **Create a new hook** をクリック

### 2. Webhook設定

以下の項目を入力：

#### 基本設定
```
Name: notify-new-talk-slot
```

#### Conditions
```
Table: call_slots
Events: INSERT ✅ (チェックを入れる)
```

オプション: **Filters** で以下を設定すると、公開されたTalk枠のみ通知：
```sql
NEW.is_published = true
```

#### Webhook Configuration
```
Type: HTTP Request
Method: POST
```

#### URL
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/notify-new-talk-slot
```

⚠️ `[YOUR-PROJECT-REF]` をプロジェクトのURLに置き換えてください

例: `https://wioealhsienyubwegvdu.supabase.co/functions/v1/notify-new-talk-slot`

**プロジェクトURLの確認方法**:
1. Project Settings → API → Project URL を確認

#### HTTP Headers

**Add header** を2回クリックして以下を追加：

```
Authorization: Bearer [YOUR-ANON-KEY]
Content-Type: application/json
```

⚠️ `[YOUR-ANON-KEY]` を実際のAnon Keyに置き換えてください

**Anon Keyの取得方法**:
1. Project Settings → API → Project API keys → `anon` `public` キーをコピー

### 3. 保存

**Create webhook** をクリック

### 4. 確認

Webhooks一覧に `notify-new-talk-slot` が表示され、Status が `Active` になっているか確認

## 🧪 ステップ4: テスト

### テスト1: Edge Functionの動作確認

1. Supabase Dashboard → **Edge Functions** を開く
2. `notify-new-talk-slot` をクリック
3. **Invocations** タブでログを確認

### テスト2: 実際にTalk枠を作成

1. インフルエンサーユーザーでログイン
2. 新しいTalk枠を作成（公開状態で）
3. Resendダッシュボードでメール送信を確認

**Resendログの確認**:
1. [Resend Dashboard](https://resend.com/emails) → Emails
2. 送信履歴を確認

### テスト3: フォロワーのメール受信確認

1. Fanユーザーでインフルエンサーをフォロー
2. そのインフルエンサーが新しいTalk枠を作成
3. Fanユーザーのメールアドレスに通知が届くことを確認

## 📊 ログの確認

### Edge Function ログ

1. Supabase Dashboard → **Edge Functions**
2. `notify-new-talk-slot` をクリック
3. **Logs** タブを開く

ログに以下が表示されるはず：
```
📧 新規Talk枠通知処理開始
📧 インフルエンサー: [名前]
📧 X人のフォロワーに通知送信
✅ メール送信成功 ([email]): [message-id]
✅ 通知処理完了: 成功 X件, 失敗 0件
```

### Database Webhook ログ

1. Supabase Dashboard → **Database** → **Webhooks**
2. `notify-new-talk-slot` をクリック
3. **Recent Invocations** を確認

## ❓ トラブルシューティング

### Edge Functionがデプロイできない

**原因**: Dashboard直接デプロイの制限

**解決策**:
1. GitHub連携を使用
2. または、Supabase CLIをインストール（後で可能になったら）
3. または、Supabase サポートに問い合わせ

### Webhookが動作しない

**確認事項**:
- ✅ Edge Functionがデプロイされているか
- ✅ WebhookのURLが正しいか
- ✅ Authorization Headerが正しいか
- ✅ call_slotsテーブルにINSERTされているか

**デバッグ**:
1. Webhook → Recent Invocations を確認
2. Edge Function → Logs を確認
3. エラーメッセージをチェック

### メールが届かない

**確認事項**:
- ✅ Resend APIキーが正しいか
- ✅ FROM_EMAILが設定されているか
- ✅ フォロワーのemailが登録されているか
- ✅ is_published = true か

**Resendで確認**:
1. [Resend Dashboard](https://resend.com/emails)
2. Emailsタブで送信履歴を確認
3. エラーがあれば詳細を確認

### よくあるエラー

#### エラー: "Invalid API key"
- RESEND_API_KEYが正しく設定されているか確認
- 環境変数を再保存

#### エラー: "Function not found"
- Edge FunctionのURLが正しいか確認
- プロジェクトURLを確認

#### エラー: "Unauthorized"
- Anon Keyが正しいか確認
- `Bearer ` が付いているか確認（スペース含む）

## ✅ 完了チェックリスト

- [ ] 環境変数3つを設定（RESEND_API_KEY, FROM_EMAIL, APP_URL）
- [ ] Edge Functionをデプロイ（または代替手段を確認）
- [ ] Database Webhookを設定
- [ ] Webhookが Active 状態
- [ ] テストでTalk枠を作成
- [ ] メールが届くことを確認
- [ ] ログでエラーがないことを確認

## 📱 次のステップ

すべて完了したら：
1. フロントエンドでフォロー機能をテスト
2. 優先表示機能をテスト
3. 本番環境にデプロイ

## 🎉 完成！

おめでとうございます！フォロー機能とメール通知機能が完成しました。

ユーザーはインフルエンサーをフォローし、新しいTalk枠が公開されたら即座にメール通知を受け取れます！
