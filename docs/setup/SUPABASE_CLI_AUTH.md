# Supabase CLI認証ガイド

## TL;DR

Supabase CLIの認証には2つの方法があります：

1. **`supabase login`** - ブラウザで自動認証（トークンを自動保存）
2. **環境変数** - `.env`に手動設定

**推奨**: `supabase login`を使用（簡単で安全）

---

## 方法1: `supabase login`（推奨）

### ステップ1: ログイン

```bash
supabase login
```

これにより：
1. ブラウザが自動的に開く
2. Supabaseにログイン（既にログイン済みなら自動）
3. トークンが自動生成される
4. トークンがローカルに安全に保存される（macOS Keychainなど）

### ステップ2: 確認

```bash
# プロジェクト一覧を取得
supabase projects list

# 正常に動作すれば、プロジェクト一覧が表示される
```

### トークンの保存場所

macOSの場合、トークンは以下のいずれかに保存されます：
- **Keychain** - システムのセキュアストレージ
- `~/Library/Application Support/supabase/` - アプリケーション設定

**利点**:
- ✅ 自動管理（手動でトークンをコピペ不要）
- ✅ セキュア（システムの安全な場所に保存）
- ✅ 有効期限管理（自動リフレッシュ）
- ✅ 複数プロファイル対応

---

## 方法2: 環境変数（手動設定）

### ステップ1: トークンを取得

1. https://app.supabase.com/account/tokens にアクセス
2. "Generate new token" をクリック
3. トークンをコピー

### ステップ2: 環境変数に設定

```bash
# .env に追加
echo "SUPABASE_ACCESS_TOKEN=sbp_your_token_here" >> .env

# 環境変数を読み込み
source .env
```

### ステップ3: 確認

```bash
# トークンが設定されているか確認
echo $SUPABASE_ACCESS_TOKEN

# プロジェクト一覧を取得
supabase projects list
```

**利点**:
- ✅ CI/CD環境で便利（GitHub Actions、Docker等）
- ✅ スクリプトで自動化しやすい
- ✅ トークンを明示的に管理

**欠点**:
- ⚠️ トークンの手動管理が必要
- ⚠️ 有効期限の手動管理が必要
- ⚠️ セキュリティリスク（誤ってコミットする可能性）

---

## どちらを使うべきか？

### ローカル開発（個人）

**推奨**: `supabase login`

```bash
# 初回のみ実行
supabase login

# その後は自動的に認証状態が維持される
supabase projects list  # ログイン不要
supabase link --project-ref wioealhsienyubwegvdu
supabase db push
```

### CI/CD環境

**推奨**: 環境変数（`SUPABASE_ACCESS_TOKEN`）

```yaml
# .github/workflows/migrate.yml
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

steps:
  - name: Run migrations
    run: supabase db push
```

### チーム開発

**推奨**: 各開発者が`supabase login`を実行

```bash
# 開発者A
supabase login  # 自分のSupabaseアカウントで認証

# 開発者B
supabase login  # 自分のSupabaseアカウントで認証

# 両者とも同じプロジェクトにアクセス可能
supabase link --project-ref wioealhsienyubwegvdu
```

---

## 認証状態の確認

### ログイン済みか確認

```bash
# プロジェクト一覧を取得（成功すればログイン済み）
supabase projects list

# 成功の場合
#         ORG ID         │   REFERENCE ID    │     NAME     │ REGION
# ──────────────────────┼───────────────────┼──────────────┼─────────
#  your-org-id         │ wioealhsienyubwegvdu │ oshicall   │ ap-northeast-1

# 失敗の場合（未ログイン）
# Access token not provided. Supply an access token by running supabase login...
```

### 現在の認証方法を確認

```bash
# 環境変数がセットされているか確認
echo $SUPABASE_ACCESS_TOKEN

# セットされていれば → 環境変数方式を使用中
# 空なら → supabase login または未認証
```

---

## トラブルシューティング

### エラー: "Access token not provided"

```bash
# 原因: 認証されていない
# 解決策1: ログイン
supabase login

# 解決策2: 環境変数を設定
source .env  # .env に SUPABASE_ACCESS_TOKEN が必要
```

### ログアウトして再ログイン

```bash
# 現在の認証をクリア
# (注: Supabase CLIには公式なlogoutコマンドがない)

# 環境変数方式の場合
unset SUPABASE_ACCESS_TOKEN

# ログイン方式の場合（Keychain削除）
# macOS: Keychain Accessアプリで "supabase" を検索して削除

# 再ログイン
supabase login
```

### 複数のプロジェクトがある場合

```bash
# プロジェクトAで作業
supabase link --project-ref project-a-ref
supabase db push

# プロジェクトBに切り替え
supabase link --project-ref project-b-ref
supabase db push
```

同じ認証（同じSupabaseアカウント）で複数プロジェクトにアクセス可能です。

---

## セキュリティのベストプラクティス

### ✅ DO

1. **ローカル開発では`supabase login`を使用**
   ```bash
   supabase login  # トークンを安全に保存
   ```

2. **CI/CDでは環境変数を使用**
   ```yaml
   env:
     SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
   ```

3. **トークンを定期的にローテーション**
   ```bash
   # 古いトークンを削除
   # https://app.supabase.com/account/tokens

   # 新しいトークンを生成
   ```

4. **最小権限の原則**
   - CI/CD用トークンは必要最小限の権限のみ

### ❌ DON'T

1. **トークンをGitにコミットしない**
   ```bash
   # .gitignore で確認
   cat .gitignore | grep .env  # → .env が含まれていることを確認
   ```

2. **トークンをSlack/メールで共有しない**
   - 各メンバーが自分のアカウントでログイン

3. **本番用トークンを開発環境で使わない**
   - 環境ごとに異なるトークンを使用（可能であれば）

---

## 既にトークンを取得している場合

あなたの状況：
> "何回かアクセストークンを取得しています。プロジェクトのDocではなくてローカルの変数として保存しているのかもしれません。"

### 確認方法

```bash
# 方法1: 環境変数を確認
echo $SUPABASE_ACCESS_TOKEN

# 方法2: .env ファイルを確認
grep SUPABASE_ACCESS_TOKEN .env

# 方法3: 実際にコマンドを実行してみる
supabase projects list
```

### 結果の解釈

#### ケース1: コマンドが成功する
```bash
$ supabase projects list
# プロジェクト一覧が表示される
```
✅ **既に認証済み**（`supabase login`済み、または環境変数設定済み）
→ 追加の設定は不要

#### ケース2: エラーが出る
```bash
$ supabase projects list
# Access token not provided...
```
❌ **未認証**
→ `supabase login`を実行するか、環境変数を設定

---

## 推奨セットアップフロー

### 初回セットアップ（5分）

```bash
# ステップ1: ログイン（ブラウザが開く）
supabase login

# ステップ2: プロジェクトにリンク
supabase link --project-ref wioealhsienyubwegvdu

# ステップ3: 動作確認
supabase migration list

# これで完了！
# 次回以降、supabase loginは不要
```

### .env ファイルの設定（オプション）

もし`supabase login`が使えない環境（Docker内など）の場合のみ：

```bash
# .env に追加
echo "SUPABASE_ACCESS_TOKEN=sbp_xxx" >> .env

# 使用時
source .env
supabase projects list
```

---

## まとめ

### あなたの状況に合わせた推奨

**現在の状態**: 何度かトークンを取得済み

**次のアクション**:
1. まず動作確認 → `supabase projects list`
2. エラーが出たら → `supabase login` を実行
3. 成功したら → `.env`設定は不要

**理由**:
- `supabase login`が最も簡単で安全
- 手動でトークン管理する必要がない
- 一度ログインすれば継続的に使用可能

---

## 参考リンク

- [Supabase CLI - Authentication](https://supabase.com/docs/guides/cli/managing-config#access-token)
- [Supabase CLI - Installation](https://supabase.com/docs/guides/cli/getting-started)
- [Managing Access Tokens](https://supabase.com/docs/guides/platform/access-tokens)
