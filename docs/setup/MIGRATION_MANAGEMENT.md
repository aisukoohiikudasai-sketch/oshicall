# Supabase Migration管理ガイド

## 概要

このプロジェクトでは、Supabase CLIを使用してデータベースマイグレーションを管理します。
これにより、開発・ステージング・本番環境間でのデータベーススキーマの一貫性を保ち、確実なデプロイが可能になります。

## なぜSupabase CLIなのか？

Alembic（FastAPI + PostgreSQL）と同様に：
- ✅ バージョン管理されたマイグレーション履歴
- ✅ ロールバック可能
- ✅ 環境間でのスキーマ同期
- ✅ GitでのコラボレーションとCode Review
- ✅ CI/CDパイプラインへの統合

Supabase CLIの追加メリット：
- 🎯 Supabaseの機能（RLS、Storage、Edge Functions）と完全統合
- 🎯 ローカル開発環境（Docker）の自動セットアップ
- 🎯 `supabase db diff` で自動マイグレーション生成
- 🎯 型安全なクライアントコード生成

---

## セットアップ

### 1. Supabase CLIインストール（既にインストール済み）

```bash
# macOS
brew install supabase/tap/supabase

# 確認
supabase --version
```

### 2. プロジェクトの初期化（既に完了）

```bash
# 既存プロジェクトにリンク
supabase link --project-ref wioealhsienyubwegvdu
```

### 3. 環境変数設定

`.env` に以下を追加（既に設定済みの場合はスキップ）：

```bash
# Supabase Project
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_DB_PASSWORD=your_db_password
```

**アクセストークン取得方法**:
1. https://app.supabase.com/account/tokens
2. "Generate new token" → 名前を入力（例: "Migration CLI"）
3. トークンをコピーして環境変数に設定

---

## マイグレーション管理のワークフロー

### パターン1: ダッシュボードで変更 → マイグレーション生成（推奨）

開発中にSupabase Dashboardで試行錯誤した後、確定したスキーマをマイグレーションとして記録する方法。

```bash
# 1. Supabase Dashboardで変更を加える（例: テーブル追加、カラム変更）

# 2. リモートと比較してマイグレーションを生成
supabase db diff --schema public --use-migra > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_new_feature.sql

# 3. 生成されたマイグレーションを確認・編集
code supabase/migrations/$(ls -t supabase/migrations/ | head -1)

# 4. ローカルで適用してテスト
supabase db reset  # ローカルDBをリセットしてマイグレーション再実行

# 5. コミット
git add supabase/migrations/
git commit -m "Add migration: new feature schema"
```

### パターン2: SQLファイルを直接作成（既存のやり方）

```bash
# 1. 新しいマイグレーションファイルを作成
supabase migration new add_new_feature

# 2. 生成されたファイルを編集
# supabase/migrations/20241101123456_add_new_feature.sql

# 3. ローカルで適用してテスト
supabase db reset

# 4. リモートにプッシュ（本番環境に反映）
supabase db push

# 5. コミット
git add supabase/migrations/
git commit -m "Add migration: new feature schema"
```

### パターン3: ローカル開発 → リモート反映

```bash
# 1. ローカルSupabaseを起動
supabase start

# 2. ローカルで開発・テスト（http://localhost:54323）

# 3. マイグレーションを生成
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_my_changes.sql

# 4. リモートに反映
supabase db push

# 5. コミット
git add supabase/migrations/
git commit -m "Add migration: local development changes"
```

---

## 環境管理

### 開発環境（Local）

```bash
# ローカルSupabaseを起動（Docker必要）
supabase start

# マイグレーション適用
supabase db reset

# ローカルダッシュボード: http://localhost:54323
```

### ステージング環境

```bash
# ステージング用プロジェクトにリンク
supabase link --project-ref your-staging-project-ref

# マイグレーション適用
supabase db push
```

### 本番環境（Production）

```bash
# 本番プロジェクトにリンク
supabase link --project-ref wioealhsienyubwegvdu

# マイグレーション適用（慎重に！）
supabase db push
```

---

## 既存のSQLファイルの統合

現在 `sql/migrations/` にある既存のマイグレーションファイルを整理します。

### 手順

```bash
# 1. 現在のリモートDBの状態をベースラインとして記録
supabase db dump --schema public > supabase/migrations/20241101000000_initial_baseline.sql

# 2. 既存のsql/migrations/を参照用にバックアップ
mkdir -p docs/legacy-migrations
cp -r sql/migrations/* docs/legacy-migrations/

# 3. 今後は supabase/migrations/ のみを使用
# sql/migrations/ は削除または読み取り専用に
```

---

## マイグレーションのベストプラクティス

### ✅ DO

1. **小さく頻繁にマイグレーション**
   - 1つのマイグレーション = 1つの機能変更

2. **わかりやすいファイル名**
   ```
   supabase/migrations/
   ├── 20241101120000_add_user_profiles_table.sql
   ├── 20241101130000_add_payment_transactions.sql
   └── 20241101140000_add_rls_policies_for_profiles.sql
   ```

3. **冪等性を保つ**
   ```sql
   -- ❌ BAD
   ALTER TABLE users ADD COLUMN email TEXT;

   -- ✅ GOOD
   ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
   ```

4. **ロールバック可能にする**
   ```sql
   -- Migration: 20241101_add_email.sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

   -- Rollback: 手動で実行する場合
   -- ALTER TABLE users DROP COLUMN IF EXISTS email;
   ```

5. **コメントを残す**
   ```sql
   -- Migration: Add email column for notification feature
   -- Ticket: OSHI-123
   -- Author: @yamadayub
   -- Date: 2024-11-01

   ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   ```

### ❌ DON'T

1. **本番DBで直接変更しない**
   - 必ずマイグレーションファイルを経由

2. **コミット済みマイグレーションを変更しない**
   - 新しいマイグレーションで修正

3. **データ削除を含む変更は慎重に**
   - バックアップ確認
   - ステージングで事前テスト

---

## 実践例

### 例1: 新しいテーブルを追加

```bash
# 1. マイグレーション作成
supabase migration new add_notifications_table

# 2. ファイル編集: supabase/migrations/20241101120000_add_notifications_table.sql
```

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'sms')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
```

```bash
# 3. ローカルでテスト
supabase db reset

# 4. リモートに適用
supabase db push

# 5. コミット
git add supabase/migrations/
git commit -m "Add notifications table with RLS policies"
git push origin main
```

### 例2: カラム追加

```bash
# 1. マイグレーション作成
supabase migration new add_user_bio_column
```

```sql
-- Add bio column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add index for text search (optional)
CREATE INDEX IF NOT EXISTS idx_users_bio_search ON users USING gin(to_tsvector('english', bio));
```

```bash
# 2. 適用
supabase db reset  # ローカルテスト
supabase db push   # リモート適用
```

### 例3: RLSポリシー変更

```bash
supabase migration new update_call_slots_rls_policies
```

```sql
-- Drop old policy
DROP POLICY IF EXISTS "Anyone can view published call slots" ON call_slots;

-- Create new policy with better performance
CREATE POLICY "Anyone can view published call slots"
  ON call_slots FOR SELECT
  USING (is_published = true AND scheduled_start_time > NOW());
```

---

## トラブルシューティング

### マイグレーションが失敗した場合

```bash
# 1. エラーメッセージを確認
supabase db push

# 2. ローカルでテスト
supabase db reset

# 3. マイグレーションを修正
code supabase/migrations/latest_migration.sql

# 4. 再実行
supabase db push
```

### ローカルとリモートが同期しない場合

```bash
# リモートの状態を取得
supabase db pull

# または、ローカルを完全にリセット
supabase db reset
```

### マイグレーション履歴を確認

```bash
# Supabase Dashboardで確認
# Database → Migrations

# または、CLIで確認
supabase migration list
```

---

## CI/CDへの統合

### GitHub Actionsの例

```yaml
# .github/workflows/migrate-production.yml
name: Deploy Database Migrations

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Supabase Project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run Migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## まとめ

### 日常的なワークフロー

1. **機能開発時**
   ```bash
   supabase migration new feature_name
   # SQLを書く
   supabase db reset  # ローカルテスト
   git commit && git push
   ```

2. **本番デプロイ前**
   ```bash
   # ステージング環境で確認
   supabase link --project-ref staging
   supabase db push

   # 問題なければ本番へ
   supabase link --project-ref production
   supabase db push
   ```

3. **緊急修正時**
   ```bash
   supabase migration new hotfix_issue_name
   # 修正SQLを書く
   supabase db push  # 直接本番適用（慎重に！）
   git commit && git push  # 後から記録
   ```

### 重要なルール

- ✅ すべてのスキーマ変更はマイグレーションファイル経由
- ✅ 本番適用前にステージングでテスト
- ✅ マイグレーションは必ずGitにコミット
- ✅ ロールバック計画を事前に用意
- ❌ コミット済みマイグレーションは変更しない

---

## 参考リンク

- [Supabase CLI - Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI - Managing Environments](https://supabase.com/docs/guides/cli/managing-environments)
- [Database Schema - Best Practices](https://supabase.com/docs/guides/database/overview)
