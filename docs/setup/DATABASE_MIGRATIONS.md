# データベースマイグレーション管理ガイド

Supabase CLIを使用したデータベーススキーマのバージョン管理とマイグレーション管理の完全ガイドです。

---

## 目次

- [クイックスタート](#クイックスタート) - 今すぐ始める（5分）
- [セットアップ](#セットアップ) - 初回設定
- [日常的な使い方](#日常的な使い方) - 実践的なワークフロー
- [認証方法](#認証方法) - supabase login vs 環境変数
- [ベストプラクティス](#ベストプラクティス)
- [トラブルシューティング](#トラブルシューティング)

---

## クイックスタート

**前提条件**: Supabase CLI がインストール済み（`supabase --version`で確認）

### ステップ1: 認証（1分）

```bash
# ブラウザで自動認証
supabase login

# 成功すると "You are now logged in" と表示される
```

### ステップ2: 動作確認（1分）

```bash
# プロジェクト一覧を確認
supabase projects list

# 既にリンク済みのプロジェクトを確認
# ● マークが付いているのが現在リンク中のプロジェクト
```

### ステップ3: 新しいマイグレーションを作成（3分）

```bash
# マイグレーションファイルを作成
supabase migration new add_my_feature

# 生成されたファイルを編集
# supabase/migrations/20251102123456_add_my_feature.sql

# 例: 新しいテーブルを追加
cat > supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1) << 'EOF'
-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
EOF

# 本番に適用
supabase db push

# コミット
git add supabase/migrations/
git commit -m "Add notifications table"
git push origin main
```

**これで完了です！** 🎉

---

## セットアップ

### 前提条件

- ✅ Supabase CLI インストール済み
- ✅ プロジェクト: `wioealhsienyubwegvdu` (oshicall-staging)
- ✅ Git リポジトリ初期化済み

### 1. 認証

Supabase CLIの認証には2つの方法があります：

#### 方法1: `supabase login`（推奨）✨

```bash
# ブラウザで自動認証
supabase login
```

**利点**:
- ✅ トークンを自動管理（コピペ不要）
- ✅ セキュア（macOS Keychainに保存）
- ✅ 継続的に使用可能
- ✅ 有効期限の自動管理
- ✅ 一度実行すれば二度と不要

**トークン保存場所**:
- macOS: システムKeychain
- Linux: `~/.config/supabase/`
- Windows: OS資格情報マネージャー

#### 方法2: 環境変数（CI/CD用のみ）

```bash
# .env に追加
SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# 使用時
source .env
supabase projects list
```

**用途**: CI/CD環境（GitHub Actions等）でのみ使用
**欠点**: 毎回 `source .env` が必要、手動管理

### 2. プロジェクトリンク確認

```bash
# プロジェクト一覧を表示
supabase projects list

# ● マークが付いていれば既にリンク済み
# なければ以下でリンク:
supabase link --project-ref wioealhsienyubwegvdu
```

### 3. 現在の状態確認

```bash
# マイグレーション一覧
supabase migration list

# ローカルとリモートの差分確認
supabase db diff --schema public
```

---

## 日常的な使い方

### パターン1: 新しい機能のマイグレーション作成

最も一般的なワークフロー：

```bash
# 1. マイグレーションファイルを作成
supabase migration new add_feature_name

# 2. 生成されたファイルを編集
code supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1)

# 3. SQLを記述（例）
cat > supabase/migrations/latest.sql << 'EOF'
-- Add new column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update RLS policy
CREATE POLICY "Users can update own phone"
  ON users FOR UPDATE
  USING (auth.uid() = auth_user_id);
EOF

# 4. 本番に適用
supabase db push

# 5. コミット
git add supabase/migrations/
git commit -m "Add phone column to users table"
git push origin main
```

### パターン2: Dashboardで変更した内容を記録

Supabase Dashboardで試行錯誤した後、確定したスキーマをマイグレーションとして記録：

```bash
# 1. Supabase Dashboard で変更（テーブル追加、カラム変更など）

# 2. 差分を確認してマイグレーションを生成
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_dashboard_changes.sql

# 3. 生成されたファイルを確認・編集
code supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1)

# 4. コミット（既に本番に反映済みなので push不要）
git add supabase/migrations/
git commit -m "Record dashboard schema changes"
git push origin main
```

### パターン3: ローカル開発環境で試す

Docker Desktopが必要：

```bash
# 1. ローカルSupabaseを起動
supabase start

# 2. ローカルで開発・テスト
# - ローカルダッシュボード: http://localhost:54323
# - ローカルAPI: http://localhost:54321

# 3. マイグレーションをローカルで適用
supabase db reset

# 4. 問題なければ本番に適用
supabase db push
```

---

## 認証方法

### 方法の選択

| 環境 | 推奨方法 | 理由 |
|------|---------|------|
| **ローカル開発** | `supabase login` | 簡単、自動管理、セキュア |
| **CI/CD** | 環境変数 | スクリプト化しやすい |
| **チーム開発** | 各自 `supabase login` | 個人のアカウントで認証 |

### ローカル開発環境（個人）

```bash
# 初回のみ実行
supabase login

# その後は自動的に認証状態が維持される
supabase projects list  # ログイン不要
supabase db push        # ログイン不要
```

### CI/CD環境（GitHub Actions等）

```yaml
# .github/workflows/migrate.yml
name: Deploy Database Migrations

on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Run Migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### 認証状態の確認

```bash
# プロジェクト一覧を取得（成功すればログイン済み）
supabase projects list

# 成功の場合
# LINKED | ORG ID | REFERENCE ID | NAME | REGION
#   ●    | ...    | wioealhsienyubwegvdu | oshicall-staging | ...

# 失敗の場合（未ログイン）
# Access token not provided...
```

---

## 環境管理

### ローカル環境（Local）

```bash
# ローカルSupabaseを起動（Docker必要）
supabase start

# マイグレーション適用
supabase db reset

# ローカルダッシュボード
open http://localhost:54323
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

### 環境の切り替え

```bash
# 現在リンクしているプロジェクトを確認
cat supabase/.temp/project-ref

# 別のプロジェクトに切り替え
supabase link --project-ref another-project-ref
```

---

## ベストプラクティス

### ✅ DO

#### 1. 小さく頻繁にマイグレーション

```bash
# ❌ BAD: 1つのマイグレーションで大量の変更
20251102_big_update.sql  # 10個のテーブル変更

# ✅ GOOD: 1つのマイグレーション = 1つの機能変更
20251102120000_add_notifications_table.sql
20251102130000_add_user_preferences_table.sql
20251102140000_update_users_rls_policies.sql
```

#### 2. わかりやすいファイル名

```bash
# ✅ GOOD
20251102120000_add_user_email_column.sql
20251102130000_create_notifications_table.sql
20251102140000_fix_follows_rls_policy.sql

# ❌ BAD
20251102120000_update.sql
20251102130000_fix.sql
20251102140000_new_feature.sql
```

#### 3. 冪等性を保つ

```sql
-- ❌ BAD: 2回実行するとエラー
ALTER TABLE users ADD COLUMN email TEXT;
CREATE INDEX idx_users_email ON users(email);

-- ✅ GOOD: 何回実行しても安全
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### 4. コメントを残す

```sql
-- Migration: Add email notification feature
-- Ticket: OSHI-123
-- Author: @yamadayub
-- Date: 2024-11-02
--
-- 説明:
-- ユーザーにメール通知を送るための機能を追加
-- notifications テーブルとRLSポリシーを作成

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### 5. RLSポリシーを忘れずに

```sql
-- テーブル作成
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ IMPORTANT: RLSを有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ✅ IMPORTANT: ポリシーを作成
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

### ❌ DON'T

#### 1. 本番DBで直接変更しない

```bash
# ❌ BAD
# Supabase Dashboardで直接本番DBを変更
# → マイグレーション履歴に記録されない

# ✅ GOOD
# Dashboardで変更 → supabase db diff で記録
supabase db diff --schema public > migration.sql
git commit && git push
```

#### 2. コミット済みマイグレーションを変更しない

```bash
# ❌ BAD: 既にコミット済みのマイグレーションを編集
code supabase/migrations/20251101_add_users.sql

# ✅ GOOD: 新しいマイグレーションで修正
supabase migration new fix_users_table
```

#### 3. データ削除を含む変更は慎重に

```sql
-- ⚠️ DANGER: データが失われる
ALTER TABLE users DROP COLUMN email;

-- ✅ BETTER: まずバックアップ
-- 1. Supabase Dashboardでテーブルをエクスポート
-- 2. ステージング環境でテスト
-- 3. 本番環境に適用
```

---

## マイグレーション管理のルール

### ファイル命名規則

Supabase CLIは `<timestamp>_name.sql` 形式を要求：

```bash
# ✅ 正しい形式
20251102120000_add_notifications_table.sql
20251102130530_update_users_rls.sql

# ❌ 認識されない形式
add_notifications_table.sql
2024-11-02_feature.sql
```

### マイグレーションの順序

タイムスタンプ順に適用されます：

```bash
supabase/migrations/
├── 20251101120000_create_users_table.sql        # 1番目
├── 20251101130000_add_users_email_column.sql    # 2番目
└── 20251102090000_create_notifications_table.sql # 3番目
```

### Gitでの管理

```bash
# すべてのマイグレーションをコミット
git add supabase/migrations/
git commit -m "Add feature: notifications"
git push origin main

# マイグレーションファイルは絶対に削除しない
# 履歴として永久保存
```

---

## トラブルシューティング

### エラー: "Access token not provided"

```bash
# 原因: 認証されていない
# 解決策:
supabase login
```

### エラー: "file name must match pattern"

```bash
# 原因: ファイル名が命名規則に従っていない
# 解決策: 正しい形式で作成
supabase migration new feature_name
# → 20251102123456_feature_name.sql が生成される
```

### マイグレーションが失敗した場合

```bash
# 1. エラーメッセージを確認
supabase db push

# 2. マイグレーションファイルを修正
code supabase/migrations/latest.sql

# 3. 再試行
supabase db push
```

### ローカルとリモートの差分を確認

```bash
# 差分を表示
supabase db diff --schema public

# 差分をマイグレーションファイルとして保存
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_sync.sql
```

### Docker が起動していない

```bash
# エラー: Cannot connect to the Docker daemon
# 解決策: Docker Desktop を起動

# macOS
open -a Docker

# または、Docker不要のコマンドを使用
supabase db push  # Docker不要
```

---

## レガシーマイグレーションについて

プロジェクトには `supabase/migrations.backup/` にレガシーマイグレーションが保存されています：

```bash
supabase/migrations.backup/
├── add_buy_now_price_to_call_slots.sql
├── add_influencer_application_status.sql
├── check_and_fix_follows.sql
├── create_follows_from_scratch.sql
├── create_follows_table.sql
├── create_follows_table_fixed.sql
├── fix_follows_policies_only.sql
├── fix_follows_rls_policies.sql
└── setup_finalize_auctions_cron.sql
```

**状態**:
- ✅ 既に本番環境に適用済み
- ⚠️ Supabase CLI の命名規則に従っていない
- 📚 参照用として保持

**今後の方針**:
- 新しいマイグレーションは `supabase/migrations/` に作成
- レガシーファイルは履歴として保持
- 削除しない

---

## 実践例

### 例1: 新しいテーブルを追加

```bash
# 1. マイグレーション作成
supabase migration new add_notifications_table

# 2. ファイル編集
cat > supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1) << 'EOF'
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
EOF

# 3. 本番適用
supabase db push

# 4. コミット
git add supabase/migrations/
git commit -m "Add notifications table with RLS policies"
git push origin main
```

### 例2: カラム追加

```bash
# 1. マイグレーション作成
supabase migration new add_user_bio_column

# 2. ファイル編集
cat > supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1) << 'EOF'
-- Add bio column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add index for text search
CREATE INDEX IF NOT EXISTS idx_users_bio_search
  ON users USING gin(to_tsvector('english', bio));
EOF

# 3. 適用
supabase db push

# 4. コミット
git add supabase/migrations/
git commit -m "Add bio column to users table"
git push origin main
```

### 例3: RLSポリシー変更

```bash
# 1. マイグレーション作成
supabase migration new update_call_slots_rls_policies

# 2. ファイル編集
cat > supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1) << 'EOF'
-- Drop old policy
DROP POLICY IF EXISTS "Anyone can view published call slots" ON call_slots;

-- Create new policy with better performance
CREATE POLICY "Anyone can view published call slots"
  ON call_slots FOR SELECT
  USING (is_published = true AND scheduled_start_time > NOW());
EOF

# 3. 適用
supabase db push

# 4. コミット
git add supabase/migrations/
git commit -m "Update call slots RLS policies for better performance"
git push origin main
```

---

## よくある質問

### Q: HerokuにSUPABASE_ACCESS_TOKENを設定する必要は？

**A**: ❌ 不要です。

理由:
```
開発者のMac
  ↓ 1. マイグレーション作成
  ↓ 2. supabase db push（本番DBに直接適用）
  ↓ 3. git push
  ↓
Heroku
  ↓ 4. コードをデプロイ（DBは既に最新）
  └─ 5. アプリを実行
```

Herokuはアプリを実行するだけで、マイグレーションは実行しません。

### Q: ローカル開発環境は必要？

**A**: ⚠️ オプションです。

本番環境に直接適用できますが、ローカル環境があると：
- ✅ 安全にテストできる
- ✅ ロールバックが簡単
- ✅ チーム開発しやすい

```bash
# Docker Desktop が必要
supabase start  # ローカルSupabase起動
```

### Q: ステージング環境は？

**A**: ✅ 推奨します。

```bash
# ステージング用プロジェクトを作成
# Supabase Dashboardで新規プロジェクト作成

# ステージングにリンク
supabase link --project-ref staging-project-ref

# マイグレーション適用
supabase db push

# 問題なければ本番へ
supabase link --project-ref wioealhsienyubwegvdu
supabase db push
```

### Q: マイグレーションのロールバックは？

**A**: ⚠️ 手動で対応します。

```bash
# 1. 新しいマイグレーションでロールバックSQLを実行
supabase migration new rollback_feature_name

# 2. ロールバックSQLを記述
cat > supabase/migrations/latest.sql << 'EOF'
-- Rollback: Remove notifications table
DROP TABLE IF EXISTS notifications;
EOF

# 3. 適用
supabase db push
```

---

## まとめ

### セットアップフロー（初回のみ）

```bash
# 1. 認証
supabase login

# 2. プロジェクトリンク確認
supabase projects list

# 3. 動作確認
supabase migration list
```

### 日常的なワークフロー

```bash
# 1. マイグレーション作成
supabase migration new feature_name

# 2. SQLを記述
code supabase/migrations/latest.sql

# 3. 本番適用
supabase db push

# 4. コミット
git add supabase/migrations/
git commit -m "Add feature"
git push origin main
```

### 重要なルール

- ✅ すべてのスキーマ変更はマイグレーションファイル経由
- ✅ 本番適用前にステージングでテスト（推奨）
- ✅ マイグレーションは必ずGitにコミット
- ✅ ロールバック計画を事前に用意
- ❌ コミット済みマイグレーションは変更しない
- ❌ 本番DBで直接変更しない

---

## 参考リンク

- [Supabase CLI - Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI - Managing Environments](https://supabase.com/docs/guides/cli/managing-environments)
- [Database Schema - Best Practices](https://supabase.com/docs/guides/database/overview)
- [Supabase CLI - Getting Started](https://supabase.com/docs/guides/cli/getting-started)
- [プロジェクト内ドキュメント](../../supabase/migrations/README.md) - マイグレーション履歴
