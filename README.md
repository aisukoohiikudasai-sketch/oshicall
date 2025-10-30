# 推しトーク (OshiTalk)

推しとつながる、あなただけの時間 - インフルエンサーとのオンライントークアプリ

## 概要

推しトーク は、アイドルファンが推しのアイドルとオンラインでトークできるアプリケーションです。オークション形式で入札し、最高価格を入札した人が推しとの特別な時間を楽しむことができます。

## 機能

- 🏠 **ホームページ**: 現在開催中のトークセッション一覧
- 💬 **トーク詳細**: 推しの情報とオークション参加
- 🎥 **ライブトーク**: リアルタイムでの推しとの会話
- 🏆 **ランキング**: 推しの人気ランキング表示
- 👤 **マイページ**: プロフィール、実績、コレクション管理
- 📊 **入札履歴**: 過去の入札履歴確認

## 技術スタック

### フロントエンド

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Zustand + React Context API
- **Date Utilities**: date-fns

### バックエンド・サービス

- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payment**: Stripe

## 開発環境セットアップ

### ステップ 1: リポジトリのクローンと依存関係のインストール

```bash
# リポジトリをクローン
git clone https://github.com/yamadayub/oshicall.git
cd oshicall

# 依存関係をインストール
npm install
```

### ステップ 2: 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase Configuration
# プロジェクトURL: https://app.supabase.com/project/[your-project-id]/settings/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Payment
# Dashboard: https://dashboard.stripe.com/
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

**各サービスの API キーの取得方法:**

1. **Supabase**:

   - [Supabase](https://supabase.com/)でアカウント作成
   - プロジェクト作成後、Settings > API から URL と anon key を取得
   - SQL Editor で `supabase_schema.sql` を実行してデータベースをセットアップ

2. **Stripe**:
   - [Stripe](https://stripe.com/)でアカウント作成
   - Dashboard > Developers > API keys から Publishable Key を取得

詳細なセットアップ手順は [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) をご覧ください。

### ステップ 3: 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアプリケーションを確認できます。

## デプロイ

### GitHub Pages

1. GitHub リポジトリの Settings > Pages でソースを「GitHub Actions」に設定
2. メインブランチにプッシュすると自動デプロイ

### Netlify

1. Netlify アカウントを作成
2. GitHub リポジトリと連携
3. ビルド設定：
   - Build command: `npm run build`
   - Publish directory: `dist`

### Heroku

```bash
# Heroku CLIでログイン
heroku login

# アプリを作成
heroku create oshicall

# デプロイ
git push heroku main
```

## ライセンス

MIT License
