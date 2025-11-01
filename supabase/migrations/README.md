# Supabase Migrations

このディレクトリには、データベーススキーマのマイグレーションファイルが含まれています。

## 現在の状態

### ✅ 認証完了
```bash
$ supabase login
✓ 認証成功

$ supabase projects list
✓ プロジェクト: wioealhsienyubwegvdu (oshicall-staging)
```

### 📁 ディレクトリ構造

```
supabase/
├── migrations/           # 現在のマイグレーション（CLI管理）
│   └── README.md        # このファイル
├── migrations.backup/   # レガシーマイグレーション（適用済み）
└── functions/           # Edge Functions
```

## レガシーマイグレーションについて

`migrations.backup/` に保存されているマイグレーションファイルは：
- ✅ **既に本番環境に適用済み**
- ⚠️ Supabase CLI の命名規則に従っていない（`<timestamp>_name.sql` 形式が必要）
- 📚 参照用として保持

これらのマイグレーションは、開発履歴として重要ですが、今後は新しい命名規則に従ったマイグレーションを作成します。

## 今後のマイグレーション作成

### 方法1: 新しい機能を追加

```bash
# マイグレーションファイルを作成
supabase migration new add_feature_name

# 生成されたファイルを編集
code supabase/migrations/$(ls -t supabase/migrations/ | head -1)

# 本番に適用
supabase db push

# コミット
git add supabase/migrations/
git commit -m "Add migration: feature description"
git push origin main
```

### 方法2: Dashboard で変更した内容を記録

```bash
# Supabase Dashboard で変更（テーブル追加、カラム変更など）

# 差分を確認してマイグレーションを生成
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_dashboard_changes.sql

# コミット
git add supabase/migrations/
git commit -m "Record dashboard schema changes"
git push origin main
```

## マイグレーション履歴

### 今後の履歴（タイムスタンプ付き）

| タイムスタンプ | マイグレーション名 | 説明 | 日付 |
|-------------|-----------------|------|------|
| - | - | （今後のマイグレーションをここに記録） | - |

### レガシー履歴（適用済み）

以下のマイグレーションは既に本番環境に適用済みです（`migrations.backup/` に保存）：

1. `create_follows_table.sql` - フォロー機能の実装
2. `create_follows_table_fixed.sql` - フォローテーブルの修正
3. `check_and_fix_follows.sql` - フォロー機能のチェックと修正
4. `create_follows_from_scratch.sql` - フォロー機能の再実装
5. `fix_follows_policies_only.sql` - RLSポリシーの修正
6. `fix_follows_rls_policies.sql` - RLSポリシーの最終修正
7. `add_buy_now_price_to_call_slots.sql` - Buy Now価格機能の追加
8. `setup_finalize_auctions_cron.sql` - オークション確定Cronの設定
9. `add_influencer_application_status.sql` - インフルエンサー申請ステータス追加

## トラブルシューティング

### マイグレーションが認識されない

```bash
# エラー: "file name must match pattern "<timestamp>_name.sql""

# 解決策: 正しい命名規則を使用
supabase migration new feature_name
# → 20251102120000_feature_name.sql が生成される
```

### リモートとローカルの差分を確認

```bash
supabase db diff --schema public
```

### マイグレーション一覧を確認

```bash
supabase migration list
```

## 参考ドキュメント

- [マイグレーション管理](../../docs/setup/MIGRATION_MANAGEMENT.md) - 完全ガイド
- [クイックスタート](../../docs/setup/MIGRATION_QUICKSTART.md) - 今すぐ始める
- [CLI認証](../../docs/setup/SUPABASE_CLI_AUTH.md) - 認証方法
- [環境変数設定](../../docs/setup/MIGRATION_ENV_SETUP.md) - 環境変数の詳細

## 次のステップ

1. ✅ `supabase login` - 完了
2. ✅ `supabase link` - 完了（wioealhsienyubwegvdu）
3. 🎯 新しいマイグレーションを作成してみる
   ```bash
   supabase migration new my_first_migration
   ```

Happy migrating! 🚀
