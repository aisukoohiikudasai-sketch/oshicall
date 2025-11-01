# マイグレーション管理 - クイックスタート

このガイドでは、今すぐマイグレーション管理を始めるための手順を説明します。

## 前提条件

- ✅ Supabase CLI インストール済み: `supabase --version`
- ✅ Supabaseプロジェクト: `wioealhsienyubwegvdu`

## ステップ1: アクセストークンを取得

1. https://app.supabase.com/account/tokens にアクセス
2. "Generate new token" をクリック
3. 名前を入力（例: "CLI Migration Access"）
4. トークンをコピー

## ステップ2: 環境変数設定

`.env` ファイルに以下を追加：

```bash
# Supabase CLI用
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

**セキュリティ**: `.env` は `.gitignore` に含まれているため、Gitにコミットされません。

## ステップ3: プロジェクトにリンク

```bash
# アクセストークンを環境変数として読み込み
source .env

# Supabaseプロジェクトにリンク
supabase link --project-ref wioealhsienyubwegvdu
```

成功すると以下のように表示されます：
```
Linked to project ref: wioealhsienyubwegvdu
```

## ステップ4: 現在のDBスキーマをベースラインとして記録

```bash
# 現在の本番DBの状態をダンプ
supabase db dump --schema public --data-only=false > supabase/migrations/$(date +%Y%m%d%H%M%S)_baseline_current_production.sql

# 確認
ls -lh supabase/migrations/
```

これで、現在の本番環境のスキーマがマイグレーションファイルとして記録されました。

## ステップ5: マイグレーション履歴を確認

```bash
# Supabase Dashboardで確認
# https://app.supabase.com/project/wioealhsienyubwegvdu/database/migrations

# または、CLIで確認
supabase migration list
```

---

## 日常的な使い方

### 新しい機能を追加する場合

```bash
# 1. マイグレーションファイルを作成
supabase migration new add_feature_name

# 2. 生成されたファイルを編集
# supabase/migrations/20241101120000_add_feature_name.sql

# 3. SQLを記述
cat > supabase/migrations/$(ls -t supabase/migrations/ | head -1) << 'EOF'
-- Add your SQL here
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
EOF

# 4. 本番に適用
supabase db push

# 5. コミット
git add supabase/migrations/
git commit -m "Add phone column to users table"
git push origin main
```

### Dashboardで変更した内容をマイグレーションとして記録

```bash
# 1. Supabase Dashboardでスキーマを変更（テーブル追加、カラム変更など）

# 2. 差分を確認してマイグレーションを生成
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_dashboard_changes.sql

# 3. 生成されたファイルを確認・編集
code supabase/migrations/$(ls -t supabase/migrations/ | head -1)

# 4. コミット
git add supabase/migrations/
git commit -m "Record dashboard schema changes"
git push origin main
```

---

## トラブルシューティング

### "Access token not provided" エラー

```bash
# 環境変数を確認
echo $SUPABASE_ACCESS_TOKEN

# 設定されていない場合
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# または、.envから読み込み
source .env
```

### マイグレーションが失敗した場合

```bash
# エラーメッセージを確認
supabase db push

# マイグレーションファイルを修正
code supabase/migrations/latest_migration.sql

# 再試行
supabase db push
```

### リモートとローカルの差分を確認

```bash
# リモートの状態を取得
supabase db diff --schema public
```

---

## 既存のsql/migrations/ディレクトリとの関係

現在、以下の2つのディレクトリが存在します：

- `sql/migrations/` - 過去の手動管理されたマイグレーション（参照用）
- `supabase/migrations/` - Supabase CLI管理のマイグレーション（今後使用）

**推奨**: 今後は `supabase/migrations/` のみを使用し、`sql/migrations/` は参照用として保持。

```bash
# 既存のマイグレーションを参照する場合
cat sql/migrations/supabase_complete_schema.sql
```

---

## 次のステップ

1. ✅ アクセストークンを取得して設定
2. ✅ プロジェクトにリンク
3. ✅ ベースラインマイグレーションを作成
4. 📖 詳細なワークフローは [`MIGRATION_MANAGEMENT.md`](./MIGRATION_MANAGEMENT.md) を参照
5. 🚀 実際にマイグレーションを作成してみる

---

## よくある質問

### Q: ステージング環境はどうする？

A: 別のSupabaseプロジェクトを作成し、同じマイグレーションを適用：

```bash
# ステージング用プロジェクトにリンク
supabase link --project-ref your-staging-project-ref

# マイグレーション適用
supabase db push
```

### Q: ロールバックはできる？

A: Supabase CLIには自動ロールバック機能はありませんが、手動で対応可能：

```bash
# 1. 新しいマイグレーションでロールバックSQLを実行
supabase migration new rollback_feature_name

# 2. ロールバックSQLを記述
cat > supabase/migrations/latest.sql << 'EOF'
ALTER TABLE users DROP COLUMN IF EXISTS phone;
EOF

# 3. 適用
supabase db push
```

### Q: ローカル開発環境は？

A: Dockerが必要ですが、完全なローカルSupabaseを起動可能：

```bash
# ローカルSupabaseを起動
supabase start

# ローカルダッシュボード: http://localhost:54323
# ローカルAPI: http://localhost:54321

# マイグレーション適用
supabase db reset
```

---

## 参考リソース

- [詳細ガイド](./MIGRATION_MANAGEMENT.md) - 完全なワークフローとベストプラクティス
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli) - 公式ドキュメント
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations) - マイグレーション詳細
