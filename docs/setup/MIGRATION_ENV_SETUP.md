# マイグレーション環境変数セットアップガイド

## TL;DR（結論）

- ✅ **Localに設定**: `.env` ファイル（開発者の個人環境）
- ❌ **Herokuには不要**: アプリ実行には不要、マイグレーションは事前完了
- ⚙️ **CI/CDに設定**: GitHub Actions使う場合のみ（オプション）

---

## 設定が必要な環境変数

### 1. SUPABASE_ACCESS_TOKEN（必須）

**用途**: Supabase CLIでプロジェクトを操作するための認証トークン

**取得方法**:
1. https://app.supabase.com/account/tokens にアクセス
2. "Generate new token" をクリック
3. 名前を入力（例: "CLI Migration Access"）
4. 生成されたトークンをコピー

**設定場所**: `.env` （ローカル開発環境のみ）

```bash
# .env に追加
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. SUPABASE_DB_PASSWORD（通常は不要）

**用途**: データベースに直接接続する場合のパスワード

**いつ必要？**:
- ❌ 通常のマイグレーション操作には**不要**
- ✅ `supabase db dump`などの一部コマンドで必要な場合がある
- ✅ ローカルSupabase起動時（`supabase start`）に自動生成される

**取得方法**:
1. https://app.supabase.com/project/wioealhsienyubwegvdu/settings/database
2. "Database password" の "Reset database password" をクリック（注意: 既存の接続に影響）
3. パスワードをコピー

**設定場所**: `.env` （必要な場合のみ）

```bash
# .env に追加（必要な場合のみ）
SUPABASE_DB_PASSWORD=your_database_password
```

---

## 設定手順

### ステップ1: アクセストークンを取得

```bash
# 1. ブラウザで https://app.supabase.com/account/tokens を開く
# 2. "Generate new token" をクリック
# 3. トークンをコピー
```

### ステップ2: .envファイルに追加

```bash
# .env ファイルを編集
echo "SUPABASE_ACCESS_TOKEN=sbp_your_token_here" >> .env
```

### ステップ3: 設定を確認

```bash
# 環境変数を読み込み
source .env

# 確認（トークンが表示される）
echo $SUPABASE_ACCESS_TOKEN

# Supabase CLIで確認
supabase projects list
```

成功すると、プロジェクト一覧が表示されます：
```
        ORG ID         │   REFERENCE ID    │     NAME     │ REGION  │ CREATED AT (UTC)
 ──────────────────────┼───────────────────┼──────────────┼─────────┼──────────────────
  your-org-id         │ wioealhsienyubwegvdu │ oshicall   │ ap-northeast-1 │ 2024-10-09
```

---

## 環境別の設定マトリックス

| 環境変数 | ローカル開発 | Heroku本番 | GitHub Actions | 用途 |
|---------|------------|-----------|---------------|------|
| `VITE_SUPABASE_URL` | ✅ `.env` | ✅ Config Vars | ✅ Secrets | フロントエンド接続 |
| `VITE_SUPABASE_ANON_KEY` | ✅ `.env` | ✅ Config Vars | ✅ Secrets | フロントエンド接続 |
| `SUPABASE_ACCESS_TOKEN` | ✅ `.env` | ❌ 不要 | ✅ Secrets | CLI認証 |
| `SUPABASE_DB_PASSWORD` | ⚠️ 必要時のみ | ❌ 不要 | ⚠️ 必要時のみ | 直接DB接続 |

### 各環境の役割

#### 1. ローカル開発環境（あなたのMac）
- **役割**: マイグレーションの作成・テスト・適用
- **必要な変数**: `SUPABASE_ACCESS_TOKEN`
- **設定ファイル**: `.env` （Gitにコミットしない）

```bash
# .env
VITE_SUPABASE_URL=https://wioealhsienyubwegvdu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxx  # ← これを追加
```

#### 2. Heroku本番環境
- **役割**: アプリケーションの実行のみ
- **必要な変数**: `VITE_*` のみ（既に設定済み）
- **設定場所**: `heroku config`

```bash
# 確認
heroku config | grep SUPABASE

# 既に設定されているはず
VITE_SUPABASE_URL: https://wioealhsienyubwegvdu.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGc...
```

**重要**: HerokuにはCLI用の変数は**不要**です。マイグレーションは開発者がローカルで実行し、その結果（スキーマ変更）が本番DBに反映されます。

#### 3. CI/CD（GitHub Actions）- オプション
- **役割**: 自動テスト・自動マイグレーション
- **必要な変数**: `SUPABASE_ACCESS_TOKEN`
- **設定場所**: GitHub Repository > Settings > Secrets

```yaml
# .github/workflows/migrate.yml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## よくある質問

### Q1: 既にSupabase CLIで操作できているなら不要？

A: **いいえ、現在は操作できていません**。

```bash
# 試してみると...
supabase projects list
# → Error: Access token not provided
```

アクセストークンを設定すると、以下のコマンドが使えるようになります：
- `supabase link` - プロジェクトにリンク
- `supabase db push` - マイグレーション適用
- `supabase db diff` - スキーマ差分生成
- `supabase migration list` - マイグレーション一覧

### Q2: HerokuにSUPABASE_ACCESS_TOKENを設定しない理由は？

A: **Herokuはアプリを動かすだけだから**。

マイグレーションのワークフロー：
```
開発者のローカル環境
  ↓ マイグレーション作成
  ├─ supabase migration new feature
  ├─ SQLを記述
  ├─ supabase db push ← ここで本番DBに直接反映
  └─ git commit & push

Heroku
  ↓ コードデプロイ（マイグレーション実行済みのDB前提）
  └─ アプリケーション起動
```

Herokuがデプロイされる時点で、データベースは**既に最新状態**です。

### Q3: SUPABASE_DB_PASSWORDは必要？

A: **通常は不要**。

必要なケース：
- `psql`などで直接DBに接続する場合
- 一部の`supabase db dump`コマンド（通常はACCESS_TOKENで十分）

不要な理由：
- Supabase CLIは`ACCESS_TOKEN`でAPI経由で操作
- パスワード不要でマイグレーション可能

### Q4: .envファイルが複数あるけど？

現在のファイル構成：
```
.env          ← メイン（開発環境用）
.env.local    ← ローカル上書き用
.env.example  ← テンプレート（Gitにコミット）
```

**推奨**: `.env` に追加
```bash
echo "SUPABASE_ACCESS_TOKEN=sbp_xxx" >> .env
```

`.env.example` も更新（チーム用）：
```bash
echo "# SUPABASE_ACCESS_TOKEN=sbp_xxx  # Supabase CLI用（https://app.supabase.com/account/tokens）" >> .env.example
```

### Q5: 複数の開発者がいる場合は？

各開発者が：
1. 自分のSupabaseアカウントでアクセストークンを生成
2. 自分の`.env`に設定
3. 同じプロジェクト（`wioealhsienyubwegvdu`）にリンク

```bash
# 各開発者が実行
supabase link --project-ref wioealhsienyubwegvdu
```

---

## セットアップチェックリスト

- [ ] アクセストークンを取得（https://app.supabase.com/account/tokens）
- [ ] `.env`に`SUPABASE_ACCESS_TOKEN`を追加
- [ ] `source .env`で環境変数を読み込み
- [ ] `supabase projects list`で動作確認
- [ ] `supabase link --project-ref wioealhsienyubwegvdu`でプロジェクトにリンク
- [ ] `.env.example`を更新（チーム用テンプレート）
- [ ] `.gitignore`に`.env`が含まれていることを確認

```bash
# 全体の確認
cat .gitignore | grep "^\.env$"  # → .env が表示されればOK
```

---

## セキュリティのベストプラクティス

### ✅ DO

1. **アクセストークンは`.env`に保存**
   ```bash
   # .env（Gitにコミットされない）
   SUPABASE_ACCESS_TOKEN=sbp_xxx
   ```

2. **`.env.example`には実際の値を入れない**
   ```bash
   # .env.example（Gitにコミット）
   # SUPABASE_ACCESS_TOKEN=  # Obtain from https://app.supabase.com/account/tokens
   ```

3. **トークンの権限を最小限に**
   - Supabaseでトークン生成時、必要な権限のみ付与

### ❌ DON'T

1. **Herokuに設定しない**
   ```bash
   # ❌ これは不要
   heroku config:set SUPABASE_ACCESS_TOKEN=sbp_xxx
   ```

2. **コードにハードコードしない**
   ```javascript
   // ❌ BAD
   const token = 'sbp_xxx';

   // ✅ GOOD
   const token = process.env.SUPABASE_ACCESS_TOKEN;
   ```

3. **公開リポジトリに`.env`をコミットしない**
   ```bash
   # .gitignore で確認
   cat .gitignore | grep .env
   ```

---

## トラブルシューティング

### エラー: "Access token not provided"

```bash
# 原因: 環境変数が設定されていない
# 解決策:
source .env
echo $SUPABASE_ACCESS_TOKEN  # 値が表示されるか確認
```

### エラー: "Invalid access token"

```bash
# 原因: トークンが間違っているか期限切れ
# 解決策: 新しいトークンを生成
# 1. https://app.supabase.com/account/tokens
# 2. 古いトークンを削除
# 3. 新しいトークンを生成
# 4. .env を更新
```

### コマンドを実行しても環境変数が読み込まれない

```bash
# 毎回 source .env を実行するのが面倒な場合
# ~/.zshrc または ~/.bashrc に追加

# プロジェクトディレクトリに移動時に自動読み込み
cd() {
  builtin cd "$@"
  if [ -f .env ]; then
    export $(cat .env | xargs)
  fi
}
```

---

## まとめ

### 設定が必要なのは？

| 項目 | 必要性 | 設定場所 |
|-----|-------|---------|
| `SUPABASE_ACCESS_TOKEN` | ✅ 必須 | `.env`（ローカルのみ） |
| `SUPABASE_DB_PASSWORD` | ⚠️ 通常不要 | 必要な場合のみ`.env` |

### 今すぐやること

```bash
# 1. アクセストークン取得
open https://app.supabase.com/account/tokens

# 2. .env に追加
echo "SUPABASE_ACCESS_TOKEN=sbp_your_token_here" >> .env

# 3. 動作確認
source .env
supabase projects list
supabase link --project-ref wioealhsienyubwegvdu
```

これで完了です！🎉

---

## 参考リンク

- [Supabase CLI Authentication](https://supabase.com/docs/guides/cli/managing-config#access-token)
- [Environment Variables Best Practices](https://12factor.net/config)
- [マイグレーション管理ガイド](./MIGRATION_MANAGEMENT.md)
- [クイックスタート](./MIGRATION_QUICKSTART.md)
