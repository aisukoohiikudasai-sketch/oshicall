# マイグレーション運用戦略

## 現在の状態（2024年11月2日時点）

### ✅ 完了している設定

1. **認証**: `supabase login` 完了
2. **プロジェクトリンク**: `wioealhsienyubwegvdu` (oshicall-staging)
3. **マイグレーションディレクトリ**: クリーン状態（新規作成準備完了）
4. **レガシーマイグレーション**: `supabase/migrations.backup/` に保存（9個）

### 📊 プロジェクト構成

```
現在:
└── Staging (wioealhsienyubwegvdu)
    └── 正常に動作中 ✅

今後:
├── Staging (wioealhsienyubwegvdu)  ← 開発・テスト環境
└── Production (新規作成予定)        ← 本番環境
```

---

## 🎯 今やるべきこと

### ✅ 結論: 今は何もしなくてOK

**理由**:
1. ✅ Staging環境は正常に動作中
2. ✅ マイグレーションディレクトリはクリーン状態
3. ✅ レガシーマイグレーションは既に適用済み
4. ✅ Supabase CLIの認証・リンク完了

**必要なアクション**: なし

現在の状態は、**今後のマイグレーション管理を始める準備が完全に整った状態**です。

---

## 🚀 Production環境を作成する時の手順

### ステップ1: Production プロジェクトを作成

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. "New project" をクリック
3. プロジェクト情報を入力:
   - **Name**: `oshicall-production`
   - **Database Password**: 強力なパスワード（保存すること）
   - **Region**: `Northeast Asia (Tokyo)` (Stagingと同じ)
   - **Pricing Plan**: 適切なプランを選択

4. プロジェクト作成完了（数分かかる）

### ステップ2: Stagingのスキーマを Production にコピー

#### 方法1: Supabase Dashboard 経由（推奨、簡単）

```bash
# 1. Staging からスキーマをエクスポート
supabase link --project-ref wioealhsienyubwegvdu
supabase db dump --schema public > staging_schema.sql

# 2. Production にリンク
supabase link --project-ref <production-project-ref>

# 3. Production にスキーマをインポート
supabase db push --dry-run  # まず確認
supabase db push            # 実際に適用

# または、SQLファイルを直接実行
# Supabase Dashboard > SQL Editor で staging_schema.sql を実行
```

#### 方法2: ベースラインマイグレーション作成（推奨、管理しやすい）

```bash
# 1. Staging のスキーマをベースラインとして記録
supabase link --project-ref wioealhsienyubwegvdu
supabase db dump --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_production_baseline.sql

# 2. Gitにコミット
git add supabase/migrations/
git commit -m "Add production baseline from staging"
git push origin main

# 3. Production プロジェクトにリンク
supabase link --project-ref <production-project-ref>

# 4. ベースラインマイグレーションを適用
supabase db push

# 完了！Production は Staging と同じ状態になる
```

### ステップ3: 環境変数の設定

#### Heroku（Production用）

```bash
# Production用のSupabase接続情報を設定
heroku config:set VITE_SUPABASE_URL=https://<production-project-ref>.supabase.co
heroku config:set VITE_SUPABASE_ANON_KEY=<production-anon-key>

# Staging用は別のHerokuアプリにするか、環境変数で切り替え
```

#### ローカル環境（.env）

```bash
# .env.production を作成
cat > .env.production << EOF
VITE_SUPABASE_URL=https://<production-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<production-anon-key>
EOF

# 使い分け
cp .env.staging .env  # Staging で開発
cp .env.production .env  # Production で確認（慎重に！）
```

### ステップ4: 動作確認

```bash
# Production にリンク
supabase link --project-ref <production-project-ref>

# マイグレーション状態を確認
supabase migration list

# テーブルが正しく作成されているか確認
# Supabase Dashboard > Table Editor で確認
```

---

## 📋 今後の運用フロー

### パターン1: 新機能開発（通常のフロー）

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Staging で開発・テスト
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Staging にリンク
supabase link --project-ref wioealhsienyubwegvdu

# マイグレーション作成
supabase migration new add_new_feature

# SQLを記述
code supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1)

# 例: 新しいテーブル追加
cat > supabase/migrations/latest.sql << 'EOF'
-- Add new feature table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'ja',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EOF

# Staging に適用
supabase db push

# アプリで動作確認（Staging環境）
npm run dev  # ローカルで確認

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. テスト成功 → Git にコミット
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

git add supabase/migrations/
git commit -m "Add user preferences feature"
git push origin main

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. Production に適用
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Production にリンク
supabase link --project-ref <production-project-ref>

# ⚠️ 重要: 必ず確認
supabase migration list
# → Local と Remote の差分を確認

# Production に適用
supabase db push

# 動作確認（本番環境）
# https://oshi-talk.com でテスト

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. 完了
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Staging に戻す（次の開発のため）
supabase link --project-ref wioealhsienyubwegvdu
```

### パターン2: 緊急修正（Hotfix）

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Production で問題発生 → 緊急修正
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. マイグレーション作成
supabase migration new hotfix_issue_name

# 2. SQLを記述（例: RLSポリシーの修正）
cat > supabase/migrations/latest.sql << 'EOF'
-- Hotfix: Fix RLS policy for call_slots
DROP POLICY IF EXISTS "Anyone can view published call slots" ON call_slots;

CREATE POLICY "Anyone can view published call slots"
  ON call_slots FOR SELECT
  USING (is_published = true);
EOF

# 3. Staging で確認
supabase link --project-ref wioealhsienyubwegvdu
supabase db push

# 4. 動作確認 OK → Git にコミット
git add supabase/migrations/
git commit -m "Hotfix: Fix call_slots RLS policy"
git push origin main

# 5. Production に適用
supabase link --project-ref <production-project-ref>
supabase db push

# 6. 動作確認
```

### パターン3: Staging で試行錯誤 → Production へ

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Staging Dashboard で色々試した後
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Staging にリンク
supabase link --project-ref wioealhsienyubwegvdu

# 2. 差分を確認してマイグレーションを生成
supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_dashboard_changes.sql

# 3. 生成されたファイルを確認・編集
code supabase/migrations/$(ls -t supabase/migrations/*.sql | head -1)

# 4. Git にコミット
git add supabase/migrations/
git commit -m "Record dashboard schema changes"
git push origin main

# 5. Production に適用
supabase link --project-ref <production-project-ref>
supabase db push
```

---

## 🔒 適用漏れを防ぐためのルール

### ルール1: マイグレーションは必ず Git 管理

```bash
# ✅ GOOD: すべてのマイグレーションをコミット
git add supabase/migrations/
git commit -m "Add feature"
git push origin main

# ❌ BAD: ローカルだけに保存
# → チームメンバーが知らない、Production に適用忘れ
```

### ルール2: Production 適用前に Staging でテスト

```bash
# ✅ GOOD
# 1. Staging で作成・テスト
# 2. Git にコミット
# 3. Production に適用

# ❌ BAD
# いきなり Production で作成
```

### ルール3: マイグレーション一覧を定期的に確認

```bash
# Staging のマイグレーション状態
supabase link --project-ref wioealhsienyubwegvdu
supabase migration list

# Production のマイグレーション状態
supabase link --project-ref <production-project-ref>
supabase migration list

# 差分があれば適用
supabase db push
```

### ルール4: マイグレーション適用ログを記録

```bash
# マイグレーション適用時のログを残す
cat > migration_log.md << EOF
## $(date +%Y-%m-%d)

### Applied to Production
- Migration: 20241102120000_add_user_preferences.sql
- Time: $(date)
- Status: ✅ Success
- Changes: Added user_preferences table

EOF

git add migration_log.md
git commit -m "Log: Applied user_preferences migration to production"
git push origin main
```

---

## 📊 マイグレーション管理のベストプラクティス

### 開発フロー

```
┌─────────────────────────────────────────────┐
│ 1. 開発者のローカル環境                          │
│    - マイグレーション作成                        │
│    - supabase migration new feature         │
├─────────────────────────────────────────────┤
│ 2. Staging 環境                             │
│    - テスト・検証                            │
│    - supabase db push (staging)             │
├─────────────────────────────────────────────┤
│ 3. Git リポジトリ                            │
│    - マイグレーションをコミット                  │
│    - git commit && git push                 │
├─────────────────────────────────────────────┤
│ 4. Production 環境                          │
│    - 本番適用                                │
│    - supabase db push (production)          │
└─────────────────────────────────────────────┘
```

### マイグレーション命名規則

```bash
# タイムスタンプ_操作_対象.sql
20241102120000_add_user_preferences_table.sql
20241102130000_update_call_slots_rls.sql
20241102140000_create_notifications_index.sql
20241103090000_alter_users_add_email.sql
```

### 環境の切り替え

```bash
# ~/.zshrc または ~/.bashrc に追加
alias sb-staging='supabase link --project-ref wioealhsienyubwegvdu'
alias sb-prod='supabase link --project-ref <production-project-ref>'

# 使い方
sb-staging  # Staging にリンク
sb-prod     # Production にリンク
```

---

## 🚨 トラブルシューティング

### Production に適用し忘れた場合

```bash
# 1. マイグレーション一覧を確認
supabase link --project-ref <production-project-ref>
supabase migration list

# Local にあって Remote にないマイグレーションを確認

# 2. 適用
supabase db push

# 3. 確認
supabase migration list
# → すべて適用されていることを確認
```

### Staging と Production で差分がある場合

```bash
# 1. Staging の状態を確認
supabase link --project-ref wioealhsienyubwegvdu
supabase db diff --schema public > staging_diff.sql

# 2. Production の状態を確認
supabase link --project-ref <production-project-ref>
supabase db diff --schema public > production_diff.sql

# 3. 差分ファイルを比較
diff staging_diff.sql production_diff.sql

# 4. 必要に応じてマイグレーションを作成
```

### マイグレーションが失敗した場合

```bash
# 1. エラーメッセージを確認
supabase db push
# → エラー内容を読む

# 2. マイグレーションファイルを修正
code supabase/migrations/latest.sql

# 3. 再試行
supabase db push

# 4. それでも失敗する場合は、新しいマイグレーションで修正
supabase migration new fix_previous_migration
```

---

## 📝 チェックリスト

### Production 環境作成時

- [ ] Supabase Dashboard で Production プロジェクト作成
- [ ] Staging からスキーマをエクスポート
- [ ] Production にスキーマをインポート
- [ ] 動作確認（テーブル、RLSポリシー等）
- [ ] 環境変数設定（Heroku、ローカル）
- [ ] Production プロジェクトIDをドキュメントに記録

### マイグレーション適用時（毎回）

- [ ] Staging でマイグレーション作成
- [ ] Staging でテスト
- [ ] Git にコミット・プッシュ
- [ ] Production にリンク
- [ ] マイグレーション一覧を確認
- [ ] Production に適用 (`supabase db push`)
- [ ] 動作確認
- [ ] ログ記録（オプション）

---

## 📚 まとめ

### 今やること

✅ **何もしなくてOK**

現在の状態は完璧です：
- Staging 正常動作中
- マイグレーションディレクトリはクリーン
- Supabase CLI 認証完了
- 今後のマイグレーション管理の準備完了

### Production 環境作成時

1. Supabase Dashboard で Production プロジェクト作成
2. Staging のスキーマをベースラインマイグレーションとして記録
3. Production にベースラインを適用

### 今後の運用

1. **新機能開発**:
   ```bash
   supabase migration new feature
   # SQLを記述
   supabase db push  # Staging
   git commit && git push
   supabase db push  # Production
   ```

2. **適用漏れ防止**:
   - すべてのマイグレーションを Git 管理
   - 定期的に `supabase migration list` で確認
   - Staging → Git → Production の順を守る

3. **環境切り替え**:
   ```bash
   supabase link --project-ref wioealhsienyubwegvdu  # Staging
   supabase link --project-ref <prod-ref>  # Production
   ```

---

## 参考ドキュメント

- [データベースマイグレーション管理](./DATABASE_MIGRATIONS.md) - 完全ガイド
- [Supabase CLI 認証](./SUPABASE_CLI_AUTH.md) - 認証詳細
- [Supabase 公式ドキュメント](https://supabase.com/docs/guides/cli/local-development)
