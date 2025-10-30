# 🚀 OshiTalk 技術仕様書

## 📋 プロジェクト概要

**OshiTalk（オシトーク）** - インフルエンサーとファンをつなぐ、1対1ビデオ通話オークションプラットフォーム

- **バージョン**: 1.0.0
- **ライセンス**: ISC
- **開発環境**: Node.js, TypeScript, React

---

## 🏗️ アーキテクチャ

### システム構成
```
┌─────────────────────────────────────────────────┐
│              フロントエンド (Vite + React)       │
│  - ユーザーインターフェース                      │
│  - Stripe Elements（カード入力）                 │
│  - Daily.co（ビデオ通話UI）                      │
└──────────────────┬──────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│         バックエンド (Express + Node.js)         │
│  - Stripe API（決済処理）                        │
│  - Daily.co API（ルーム管理）                    │
│  - Supabase Service Role Key（管理者権限）      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│          Supabase（BaaS）                        │
│  - PostgreSQL（データベース）                    │
│  - Authentication（認証）                        │
│  - Storage（画像保存）                           │
│  - Row Level Security（RLS）                    │
└──────────────────────────────────────────────────┘
```

---

## 🎨 フロントエンド

### コアテクノロジー
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **React** | 18.3.1 | UIライブラリ |
| **TypeScript** | 5.5.3 | 型安全な開発 |
| **Vite** | 5.4.2 | ビルドツール |
| **React Router DOM** | 6.30.1 | ルーティング |

### UI/スタイリング
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Tailwind CSS** | 3.4.1 | CSSフレームワーク |
| **PostCSS** | 8.4.35 | CSS変換 |
| **Autoprefixer** | 10.4.18 | ベンダープレフィックス |
| **Lucide React** | 0.344.0 | アイコンライブラリ |

### 状態管理・ユーティリティ
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Zustand** | 5.0.8 | 軽量状態管理 |
| **date-fns** | 4.1.0 | 日付処理 |

### 主要ライブラリ
| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| **@supabase/supabase-js** | 2.57.4 | Supabaseクライアント |
| **@stripe/stripe-js** | 8.0.0 | Stripe JavaScript SDK |
| **@stripe/react-stripe-js** | 5.2.0 | Stripe React コンポーネント |
| **@daily-co/daily-js** | 0.84.0 | Daily.co JavaScript SDK |
| **@daily-co/daily-react** | 0.23.2 | Daily.co React フック |

### 開発ツール
| ツール | バージョン | 用途 |
|-------|-----------|------|
| **ESLint** | 9.9.1 | コード品質チェック |
| **TypeScript ESLint** | 8.3.0 | TypeScript用ESLint |

---

## ⚙️ バックエンド

### コアテクノロジー
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Node.js** | 18.x以上 | JavaScript実行環境 |
| **Express** | 5.1.0 | Webフレームワーク |
| **TypeScript** | 5.9.3 | 型安全な開発 |

### 主要ライブラリ
| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| **Stripe** | 19.1.0 | 決済処理SDK |
| **@supabase/supabase-js** | 2.74.0 | Supabaseクライアント |
| **Axios** | 1.12.2 | HTTPクライアント |
| **CORS** | 2.8.5 | CORS設定 |
| **dotenv** | 17.2.3 | 環境変数管理 |

### 開発ツール
| ツール | バージョン | 用途 |
|-------|-----------|------|
| **ts-node** | 10.9.2 | TypeScript実行 |
| **Nodemon** | 3.1.10 | ホットリロード |
| **@types/node** | 24.7.0 | Node.js型定義 |
| **@types/express** | 5.0.3 | Express型定義 |
| **@types/cors** | 2.8.19 | CORS型定義 |

---

## 🗄️ データベース・バックエンドサービス

### Supabase（PostgreSQL）

#### 認証
- **Supabase Auth**
- Google OAuth 2.0
- メールアドレス + パスワード認証
- JWT（JSON Web Token）ベース

#### データベース
- **PostgreSQL** (Supabase管理)
- **Row Level Security (RLS)** - テーブルレベルのアクセス制御
- **リアルタイムサブスクリプション**（将来実装可能）

#### 主要テーブル
| テーブル | 用途 |
|---------|------|
| `users` | ユーザー情報（ファン・インフルエンサー統合） |
| `call_slots` | トーク枠情報 |
| `auctions` | オークション情報 |
| `bids` | 入札情報 |
| `purchased_slots` | 購入済み枠（落札後） |
| `payment_transactions` | 決済履歴 |
| `reviews` | レビュー・評価 |

#### ストレージ
- **Supabase Storage**
- バケット: `profile-images`, `talk-images`
- 対応フォーマット: JPEG, PNG, WebP
- 最大サイズ: 5MB

#### ビュー
- `active_auctions_view` - アクティブなオークション一覧

#### RPC関数
- `update_user_statistics()` - ユーザー統計の更新

---

## 💳 決済サービス

### Stripe

#### APIバージョン
- **Stripe API**: Latest (19.1.0 SDK)
- **モード**: テストモード / 本番モード

#### 主要機能
| 機能 | 説明 |
|------|------|
| **Customer** | 顧客管理 |
| **SetupIntent** | カード登録 |
| **PaymentIntent** | 決済処理 |
| **Payment Method** | 支払い方法管理 |

#### 決済フロー
1. **カード登録**: SetupIntent → PaymentMethod保存
2. **与信確保**: PaymentIntent作成（manual capture）
3. **決済確定**: PaymentIntent capture
4. **キャンセル**: PaymentIntent cancel

#### セキュリティ
- **Stripe Elements**: PCI DSS準拠のカード入力UI
- **トークン化**: カード情報を直接扱わない
- **Webhook**: イベント通知（将来実装可能）

---

## 📹 ビデオ通話サービス

### Daily.co

#### SDK
- **@daily-co/daily-js**: 0.84.0
- **@daily-co/daily-react**: 0.23.2

#### 主要機能
| 機能 | 説明 |
|------|------|
| **Room Creation** | 通話ルーム作成 |
| **Meeting Token** | 認証トークン生成 |
| **Prebuilt UI** | 組み込みビデオ通話UI |
| **Room Management** | ルーム情報取得・削除 |

#### ルーム設定
```javascript
{
  privacy: 'private',           // プライベートルーム
  max_participants: 2,          // 最大2人
  nbf: scheduled_time - 15分,   // 15分前から入室可
  exp: scheduled_time + 通話時間 + 10分, // 終了後10分まで有効
  enable_chat: true,            // チャット有効
  enable_screenshare: true,     // 画面共有有効
  enable_noise_cancellation_ui: true // ノイズキャンセル
}
```

#### トークン設定
```javascript
{
  room_name: 'call-{purchasedSlotId}',
  user_name: 'ユーザー名',
  user_id: 'uuid',
  is_owner: インフルエンサーかどうか,
  exp: 24時間後
}
```

---

## 🚀 デプロイ・インフラ

### Heroku

#### アプリケーション構成
- **アプリ名**: oshicall
- **スタック**: heroku-24
- **ビルドパック**: heroku/nodejs
- **リージョン**: US

#### デプロイ方式
- **統合デプロイ**: フロントエンド + バックエンド
- **ビルド**: `npm run build`（両方をビルド）
- **起動**: `npm start`（Express経由でフロントエンド配信）

#### 環境変数
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_URL=https://your-project.supabase.co

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Daily.co
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=your-subdomain.daily.co

# その他
FRONTEND_URL=https://your-app.herokuapp.com
VITE_BACKEND_URL=（空 - 相対パス使用）
```

#### ポート
- **本番**: `process.env.PORT`（Heroku自動割当）
- **開発**: 3001（バックエンド）, 5173（フロントエンド）

---

## 🔐 セキュリティ

### 認証・認可
- **Supabase Auth**: JWT ベースの認証
- **Row Level Security**: PostgreSQLレベルのアクセス制御
- **Service Role Key**: バックエンドのみで使用（管理者権限）

### データ保護
- **環境変数**: 機密情報は環境変数で管理
- **HTTPS**: すべての通信を暗号化
- **CORS**: 許可されたオリジンのみアクセス可能

### 決済セキュリティ
- **PCI DSS準拠**: Stripe Elementsを使用
- **トークン化**: カード情報を直接扱わない
- **Manual Capture**: 与信確保後に手動決済

---

## 📁 プロジェクト構造

```
oshicall/
├── src/                    # フロントエンドソース
│   ├── api/               # API関数
│   ├── components/        # Reactコンポーネント
│   ├── contexts/          # Context API
│   ├── lib/              # ユーティリティ
│   ├── pages/            # ページコンポーネント
│   └── types/            # TypeScript型定義
├── backend/               # バックエンドソース
│   └── src/
│       ├── routes/       # APIルート
│       ├── utils/        # ユーティリティ
│       └── server.ts     # メインサーバー
├── public/               # 静的ファイル
├── dist/                 # ビルド出力
└── supabase/             # Supabaseスクリプト（SQL等）
```

---

## 🔧 開発環境

### 必要なツール
- **Node.js**: 18.x 以上
- **npm**: 10.x 以上
- **Git**: バージョン管理

### 開発コマンド
```bash
# フロントエンド開発サーバー起動
npm run dev

# バックエンド開発サーバー起動
npm run dev:server

# ビルド
npm run build

# 本番起動
npm start

# Lintチェック
npm run lint
```

### ローカル環境変数
- **フロントエンド**: `.env.local`（Vite）
- **バックエンド**: `backend/.env`（dotenv）

---

## 📊 API エンドポイント

### Stripe関連
- `POST /api/stripe/create-customer` - 顧客作成
- `POST /api/stripe/create-setup-intent` - カード登録Intent作成
- `POST /api/stripe/confirm-payment-method` - カード登録確認
- `POST /api/stripe/authorize-payment` - 決済与信
- `POST /api/stripe/set-default-payment-method` - デフォルトカード設定

### オークション関連
- `POST /api/auctions/finalize-ended` - オークション終了処理

### Daily.co関連
- `POST /api/calls/create-room` - 通話ルーム作成
- `POST /api/calls/join-room` - 通話参加
- `POST /api/calls/end-call` - 通話終了
- `GET /api/calls/status/:purchasedSlotId` - 通話ステータス取得

### 静的ファイル配信
- `/*` - フロントエンド（Express経由）

---

## 🌐 外部サービス連携

### Google Cloud Platform
- **OAuth 2.0**: Google認証
- **承認済みリダイレクトURI設定**

### 使用しているAPI
| サービス | API | 用途 |
|---------|-----|------|
| **Supabase** | REST API | データベース操作 |
| **Supabase** | Auth API | 認証 |
| **Supabase** | Storage API | 画像アップロード |
| **Stripe** | REST API | 決済処理 |
| **Daily.co** | REST API | ビデオ通話管理 |

---

## 📝 コーディング規約

### TypeScript
- **Strict モード**: 有効
- **型定義**: `src/types/index.ts`で一元管理
- **命名規則**: camelCase（変数・関数）、PascalCase（型・コンポーネント）

### React
- **関数コンポーネント**: Hooks使用
- **ファイル構造**: 1ファイル1コンポーネント
- **スタイル**: Tailwind CSSユーティリティクラス

### バックエンド
- **async/await**: Promise処理
- **エラーハンドリング**: try-catch必須
- **ログ出力**: console.log（将来的にロガーライブラリ推奨）

---

## 🔄 今後の拡張性

### 実装可能な機能
1. **リアルタイム入札**: Supabase Realtime
2. **プッシュ通知**: Firebase Cloud Messaging
3. **メール通知**: SendGrid, AWS SES
4. **自動オークション終了**: Supabase Cron Jobs
5. **Stripe Connect**: インフルエンサーへの自動送金
6. **録画機能**: Daily.co Recording API
7. **チャット機能**: Daily.co Chat API

---

## 📚 参考ドキュメント

### 公式ドキュメント
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/docs)
- [Stripe](https://docs.stripe.com/)
- [Daily.co](https://docs.daily.co/)
- [Express](https://expressjs.com/)
- [Node.js](https://nodejs.org/)

---

## 📞 サポート

### 問題が発生した場合
1. `npm install` で依存関係を再インストール
2. `.env` ファイルの環境変数を確認
3. ブラウザのキャッシュをクリア
4. Herokuの環境変数を確認

### よくある問題
- **Supabase接続エラー**: 環境変数の確認
- **Stripe決済エラー**: APIキーとモードの確認
- **Daily.co接続エラー**: APIキーとドメインの確認
- **ビルドエラー**: Node.jsバージョンの確認

---

**最終更新日**: 2025年10月14日  
**バージョン**: 1.0.0  
**ステータス**: 本番稼働中 ✅

