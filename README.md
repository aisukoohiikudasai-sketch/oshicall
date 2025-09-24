# OshiCall

推しとの特別な時間を - アイドルとのオンライントークアプリ

## 概要

OshiCall は、アイドルファンが推しのアイドルとオンラインでトークできるアプリケーションです。オークション形式で入札し、最高価格を入札した人が推しとの特別な時間を楽しむことができます。

## 機能

- 🏠 **ホームページ**: 現在開催中のトークセッション一覧
- 💬 **トーク詳細**: 推しの情報とオークション参加
- 🎥 **ライブトーク**: リアルタイムでの推しとの会話
- 🏆 **ランキング**: 推しの人気ランキング表示
- 👤 **マイページ**: プロフィール、実績、コレクション管理
- 📊 **入札履歴**: 過去の入札履歴確認

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API

## 開発環境セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yamadayub/oshicall.git
cd oshicall

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

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
