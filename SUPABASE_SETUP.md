# Supabase 認証セットアップガイド

このガイドでは、OshiCall アプリケーションを Clerk から Supabase 認証に移行する手順を説明します。

## 1. 環境変数の設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe設定（既存）
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Supabase の認証情報を取得する方法

1. [Supabase](https://supabase.com/)にログイン
2. プロジェクトを作成または選択
3. 左サイドバーの「Settings」→「API」を開く
4. 「Project URL」をコピーして `VITE_SUPABASE_URL` に設定
5. 「Project API keys」の「anon public」キーをコピーして `VITE_SUPABASE_ANON_KEY` に設定

## 2. データベーススキーマのセットアップ

### 新規プロジェクトの場合

1. Supabase ダッシュボードで「SQL Editor」を開く
2. `supabase_schema.sql` ファイルの内容をコピー＆ペースト
3. 「Run」ボタンをクリックして実行

### 既存データを移行する場合

1. **必ずバックアップを取ってから実行してください**
2. Supabase ダッシュボードで「SQL Editor」を開く
3. `supabase_migration.sql` ファイルの内容をコピー＆ペースト
4. スクリプトを確認し、必要に応じて調整
5. 「Run」ボタンをクリックして実行

## 3. Supabase 認証プロバイダーの設定

### メール/パスワード認証を有効化

1. Supabase ダッシュボードで「Authentication」→「Providers」を開く
2. 「Email」プロバイダーが有効になっていることを確認
3. 必要に応じて、メール確認を有効化または無効化

### Google 認証を有効化（オプション）

1. 「Authentication」→「Providers」を開く
2. 「Google」プロバイダーを探して有効化
3. Google Cloud Console で OAuth 2.0 クライアントを作成
4. クライアント ID とシークレットを Supabase に設定
5. リダイレクト URI を設定: `https://your-project.supabase.co/auth/v1/callback`

## 4. Row Level Security (RLS) ポリシーの確認

`supabase_schema.sql` を実行すると、RLS ポリシーが自動的に設定されます。
Supabase ダッシュボードで以下を確認してください：

1. 「Authentication」→「Policies」を開く
2. 各テーブルにポリシーが設定されていることを確認
3. 必要に応じてポリシーを調整

## 5. 依存関係のインストール

Clerk パッケージを削除し、依存関係を更新します：

```bash
# 既存のnode_modulesを削除（推奨）
rm -rf node_modules

# 依存関係を再インストール
npm install
```

## 6. アプリケーションの起動

```bash
npm run dev
```

アプリケーションが起動したら、ブラウザで `http://localhost:5173` を開き、以下をテストしてください：

1. 新規登録
2. ログイン
3. ログアウト
4. Google 認証（設定した場合）

## 7. トラブルシューティング

### 「Supabase 環境変数が設定されていません」エラー

- `.env` ファイルが正しく作成されているか確認
- 環境変数名が正確であるか確認（`VITE_` プレフィックスが必要）
- 開発サーバーを再起動

### 「認証エラーが発生しました」エラー

- Supabase プロジェクトのメール認証が有効になっているか確認
- RLS ポリシーが正しく設定されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### データベース接続エラー

- Supabase URL と Anon Key が正しいか確認
- Supabase プロジェクトが起動しているか確認
- ネットワーク接続を確認

## 8. データモデルの説明

### テーブル構造

- **fans**: ファン情報
  - `auth_user_id`: Supabase Auth のユーザー ID
  - `display_name`: 表示名
  - `profile_image_url`: プロフィール画像 URL
- **influencers**: インフルエンサー情報

  - `auth_user_id`: Supabase Auth のユーザー ID
  - `display_name`: 表示名
  - `bio`: 自己紹介
  - `is_verified`: 認証済みフラグ

- **call_slots**: 通話枠情報
- **auctions**: オークション情報
- **bids**: 入札情報
- **purchased_slots**: 購入済み通話枠

## 9. セキュリティのベストプラクティス

1. **環境変数の保護**

   - `.env` ファイルを `.gitignore` に追加（既に設定済み）
   - 本番環境では環境変数を安全に管理

2. **RLS ポリシーの確認**

   - すべてのテーブルで RLS が有効になっているか確認
   - ユーザーが自分のデータのみアクセスできることを確認

3. **認証の強化**

   - パスワードの最小長を 6 文字以上に設定
   - メール確認を有効化（本番環境推奨）

4. **API キーの管理**
   - Anon Key は公開可能（クライアント側で使用）
   - Service Role Key は絶対に公開しない（サーバー側のみ）

## 10. 次のステップ

- [ ] テスト環境で動作確認
- [ ] 既存ユーザーのデータ移行計画を立てる
- [ ] 本番環境へのデプロイ
- [ ] ユーザーに移行のお知らせを送信

## サポート

問題が発生した場合は、以下を確認してください：

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
