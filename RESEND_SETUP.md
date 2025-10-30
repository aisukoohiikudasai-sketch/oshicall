# Resend メール通知セットアップガイド

このガイドでは、オークション落札時のメール通知機能のセットアップ方法を説明します。

## 1. Resendアカウントの作成

1. [Resend](https://resend.com/)にアクセス
2. アカウントを作成（GitHub、Googleアカウントでサインアップ可能）
3. 無料プランで月3,000通まで送信可能

## 2. API Keyの取得

1. Resendダッシュボードにログイン
2. 左メニューから「API Keys」を選択
3. 「Create API Key」をクリック
4. 名前を入力（例: `OshiTalk Production`）
5. 権限は「Sending access」を選択
6. API Keyをコピー（**一度しか表示されないため注意**）

## 3. ドメイン認証（本番環境）

### オプションA: カスタムドメインを使用する場合

1. Resendダッシュボードで「Domains」を選択
2. 「Add Domain」をクリック
3. ドメイン（例: `oshicall.com`）を入力
4. 表示されたDNSレコードをドメインのDNS設定に追加
   - SPF レコード
   - DKIM レコード
   - DMARC レコード（推奨）
5. 認証が完了するまで待つ（通常数分〜24時間）

### オプションB: Resendのドメインを使用する場合（開発環境）

- 開発・テスト環境では `onboarding@resend.dev` を使用可能
- 送信先は登録したメールアドレスのみ

## 4. Supabase環境変数の設定

### Supabase Dashboardで設定

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. 左メニューから「Project Settings」→「Edge Functions」を選択
4. 「Environment Variables」セクションで以下を追加:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=OshiTalk <noreply@oshicall.com>
APP_URL=https://oshicall-2936440db16b.herokuapp.com
```

### ローカル開発環境

1. プロジェクトルートに `.env.local` ファイルを作成（gitignoreに追加済み）
2. 以下を記述:

```bash
# Resend設定
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=OshiTalk <noreply@oshicall.com>
APP_URL=http://localhost:5173
```

3. Supabase CLIで環境変数を設定:

```bash
# Supabase Edge Functionの環境変数を設定
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set FROM_EMAIL="OshiTalk <noreply@oshicall.com>"
supabase secrets set APP_URL=http://localhost:5173
```

## 5. メールテンプレートのカスタマイズ

メールテンプレートは以下のファイルで管理されています:

```
supabase/functions/_shared/email-templates.ts
```

### カスタマイズ可能な項目

- HTML/プレーンテキスト形式
- デザイン（カラー、レイアウト等）
- 文言
- フッター情報

## 6. デプロイ

### Edge Functionのデプロイ

```bash
# Supabase Edge Functionをデプロイ
supabase functions deploy finalize-auctions

# デプロイ確認
supabase functions list
```

### 動作確認

1. テスト用のオークションを作成
2. 入札して落札
3. オークション終了時刻を過ぎる（または手動でcronをトリガー）
4. 落札者のメールアドレスにメールが届くことを確認

## 7. トラブルシューティング

### メールが届かない場合

1. **Resend APIキーの確認**
   ```bash
   supabase secrets list
   ```

2. **ログの確認**
   ```bash
   supabase functions logs finalize-auctions
   ```

3. **Resendダッシュボードでログを確認**
   - 左メニュー「Logs」で送信履歴を確認
   - エラーメッセージがある場合は内容を確認

4. **よくあるエラー**
   - `Invalid API Key`: APIキーが正しくない
   - `Domain not verified`: ドメイン認証が未完了
   - `Email not allowed`: 開発環境で未登録のメールアドレスに送信しようとした

### スパムフォルダに入る場合

- SPF、DKIM、DMARCレコードが正しく設定されているか確認
- 送信元メールアドレスが認証済みドメインと一致しているか確認
- 送信量が多すぎないか確認（レート制限）

## 8. 監視とメトリクス

### Resendダッシュボード

- 送信成功率
- バウンス率
- スパム報告率
- 配信時間

### Supabase Functions ログ

```bash
# リアルタイムログの表示
supabase functions logs finalize-auctions --tail

# 特定期間のログを表示
supabase functions logs finalize-auctions --since "2024-01-01"
```

## 9. コスト

### Resend料金プラン

- **Free**: 3,000通/月（開発・テスト用）
- **Pro**: $20/月 50,000通（本番環境推奨）
- **Business**: カスタム（大規模運用）

詳細: https://resend.com/pricing

## 10. セキュリティ

- ✅ APIキーは環境変数で管理（コードにハードコードしない）
- ✅ APIキーは定期的にローテーション
- ✅ 本番環境と開発環境で異なるAPIキーを使用
- ✅ 送信元メールアドレスのドメイン認証を実施
- ✅ ログには個人情報を含めない

## サポート

問題が解決しない場合:
- Resend公式ドキュメント: https://resend.com/docs
- Resendサポート: https://resend.com/support
- Supabase Edge Functionsドキュメント: https://supabase.com/docs/guides/functions
