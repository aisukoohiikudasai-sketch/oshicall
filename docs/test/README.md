# テストドキュメント

このディレクトリには、OshiTalkのテスト関連ドキュメントが含まれています。

## 📁 ドキュメント一覧

### テストガイド
- **[E2E_TEST_GUIDE.md](./E2E_TEST_GUIDE.md)** - E2Eテストガイド（ローカル環境）
- **[STAGING_E2E_TEST_GUIDE.md](./STAGING_E2E_TEST_GUIDE.md)** - ステージング環境E2Eテストガイド

### テストデータ
- **[TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md)** - テストアカウント情報
- **[TEST_CARD_REGISTRATION.md](./TEST_CARD_REGISTRATION.md)** - テストカード登録ガイド

## 🧪 テスト環境

### ローカル環境
ローカル開発環境でのテスト手順は [E2E_TEST_GUIDE.md](./E2E_TEST_GUIDE.md) を参照してください。

### ステージング環境
本番相当のステージング環境でのテスト手順は [STAGING_E2E_TEST_GUIDE.md](./STAGING_E2E_TEST_GUIDE.md) を参照してください。

## 💳 テストデータ

### Stripe テストカード
決済機能のテストには、Stripeのテストカードを使用します。詳細は [TEST_CARD_REGISTRATION.md](./TEST_CARD_REGISTRATION.md) を参照してください。

**よく使うテストカード:**
- 成功: `4242 4242 4242 4242`
- 3Dセキュア: `4000 0027 6000 3184`
- 拒否: `4000 0000 0000 0002`

### テストアカウント
各種ロールのテストアカウントは [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) を参照してください。

## 🔍 テストチェックリスト

### 基本フロー
- [ ] ユーザー登録・ログイン
- [ ] カード情報登録
- [ ] Talk枠作成（インフルエンサー）
- [ ] 入札・即決購入
- [ ] オークション確定
- [ ] Talk実施

### エラーケース
- [ ] カード決済エラー
- [ ] 入札金額不足
- [ ] 重複入札
- [ ] 通話接続エラー

### パフォーマンス
- [ ] ページ読み込み速度
- [ ] API応答時間
- [ ] 画像読み込み

## 🔗 関連リンク

- [全体README](../README.md) - ドキュメント全体の概要
- [機能ドキュメント](../functions/) - 各機能の詳細仕様
- [トラブルシューティング](../troubleshooting/) - よくある問題と解決方法
