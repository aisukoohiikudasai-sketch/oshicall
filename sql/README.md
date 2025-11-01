# SQLディレクトリ - レガシーマイグレーション

## ⚠️ 重要なお知らせ

このディレクトリ（`sql/`）は**レガシーマイグレーション**として保持されています。

**今後のマイグレーション管理**:
- ✅ 使用する: `supabase/migrations/` （Supabase CLI管理）
- ❌ 使用しない: `sql/migrations/` （手動管理、参照用のみ）

詳細は [`docs/setup/MIGRATION_MANAGEMENT.md`](../docs/setup/MIGRATION_MANAGEMENT.md) を参照してください。

---

## ディレクトリ構造

```
sql/
├── migrations/     # 過去の手動マイグレーション（参照用）
├── fixes/          # 緊急バグ修正SQL（参照用）
└── tests/          # テスト・検証SQL（参照用）
```

### migrations/ - レガシーマイグレーション

過去に手動で管理されていたマイグレーションファイル。
これらは既に本番環境に適用済みです。

**現在の役割**:
- 過去のスキーマ変更履歴の参照
- 特定の変更の理由や経緯を確認
- 新しいマイグレーション作成時の参考

**重要なファイル**:
- `supabase_complete_schema.sql` - 初期スキーマ全体
- `supabase_unified_users.sql` - ユーザーテーブルの統合
- `supabase_rpc_functions.sql` - RPC関数定義

### fixes/ - バグ修正SQL

過去の緊急バグ修正やRLSポリシー修正。

**現在の役割**:
- トラブルシューティングの参考
- 同様の問題が発生した場合の対処法確認

**代表的なファイル**:
- `fix_supabase_security_errors_v2.sql` - セキュリティエラー修正
- `fix_auction_rls.sql` - オークションRLS修正
- `add_daily_columns.sql` - Daily.co統合時のカラム追加

### tests/ - テスト・検証SQL

データベース状態の確認やテスト用SQL。

**現在の役割**:
- データベース状態の手動確認
- デバッグ時の参考

**代表的なファイル**:
- `check_database.sql` - データベース全体の状態確認
- `verify_auction_completion.sql` - オークション完了処理の検証

---

## 今後の運用方針

### ✅ 新しいマイグレーション作成時

```bash
# supabase/migrations/ を使用
supabase migration new feature_name
```

**参照**: [`docs/setup/MIGRATION_QUICKSTART.md`](../docs/setup/MIGRATION_QUICKSTART.md)

### 📖 レガシーファイルを参照する場合

```bash
# 過去の変更内容を確認
cat sql/migrations/supabase_complete_schema.sql

# 特定の修正方法を参照
cat sql/fixes/fix_auction_rls.sql
```

### 🔍 デバッグ時

```bash
# テストSQLを実行（Supabase Dashboardで）
cat sql/tests/check_database.sql
```

---

## マイグレーション履歴の統合

### ベースラインマイグレーションの作成

既存の本番環境の状態を新しいマイグレーション管理システムに統合：

```bash
# 1. 現在の本番DBをダンプ
supabase db dump --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_baseline_production.sql

# 2. レガシーマイグレーションは参照用として保持
# sql/migrations/ はそのまま残す
```

### 過去の変更履歴を確認する場合

```bash
# 時系列順に確認
ls -lt sql/migrations/

# 特定のテーブルの変更履歴を検索
grep -r "CREATE TABLE users" sql/migrations/
grep -r "ALTER TABLE call_slots" sql/migrations/
```

---

## よくあるユースケース

### ケース1: 過去の変更理由を確認したい

```bash
# 該当するマイグレーションファイルを検索
grep -r "add_daily_columns" sql/

# ファイルを確認
cat sql/fixes/add_daily_columns.sql
```

### ケース2: 同じようなRLS修正が必要

```bash
# 過去のRLS修正を参照
cat sql/fixes/fix_auction_rls.sql

# 新しいマイグレーションを作成
supabase migration new fix_new_table_rls

# 参考にしながらSQLを記述
code supabase/migrations/$(ls -t supabase/migrations/ | head -1)
```

### ケース3: データベース状態を手動確認

```bash
# Supabase DashboardのSQL Editorで実行
cat sql/tests/check_database.sql
```

---

## 削除してはいけない理由

このディレクトリは以下の理由で保持されています：

1. **変更履歴の記録**: 過去のスキーマ変更の経緯と理由
2. **トラブルシューティング**: 同様の問題が発生した場合の参考
3. **監査証跡**: コンプライアンスやセキュリティ監査のため
4. **新メンバーのオンボーディング**: プロジェクトの歴史を理解するため

---

## まとめ

- 📁 **sql/migrations/** = レガシー（参照用）
- ✨ **supabase/migrations/** = 現在のマイグレーション管理
- 📖 新しいマイグレーション作成時は [`MIGRATION_QUICKSTART.md`](../docs/setup/MIGRATION_QUICKSTART.md) を参照
- 🔍 過去の変更を参照する場合はこのディレクトリを活用

**次のステップ**: [`docs/setup/MIGRATION_QUICKSTART.md`](../docs/setup/MIGRATION_QUICKSTART.md) でマイグレーション管理を始める
