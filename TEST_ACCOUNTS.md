# テスト用アカウント認証情報

## 概要

Staging 環境でのテスト工数削減のため、事前に作成されたテスト用アカウントの認証情報です。

## ファンアカウント（一般ユーザー）10 個

### ファンアカウント #1

- **Email**: `fan-test-01@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_01`
- **Display Name**: `テストファン01`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #2

- **Email**: `fan-test-02@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_02`
- **Display Name**: `テストファン02`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #3

- **Email**: `fan-test-03@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_03`
- **Display Name**: `テストファン03`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #4

- **Email**: `fan-test-04@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_04`
- **Display Name**: `テストファン04`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #5

- **Email**: `fan-test-05@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_05`
- **Display Name**: `テストファン05`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #6

- **Email**: `fan-test-06@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_06`
- **Display Name**: `テストファン06`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #7

- **Email**: `fan-test-07@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_07`
- **Display Name**: `テストファン07`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #8

- **Email**: `fan-test-08@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_08`
- **Display Name**: `テストファン08`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #9

- **Email**: `fan-test-09@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_09`
- **Display Name**: `テストファン09`
- **Role**: 一般ユーザー（ファン）

### ファンアカウント #10

- **Email**: `fan-test-10@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `fan_test_10`
- **Display Name**: `テストファン10`
- **Role**: 一般ユーザー（ファン）

## インフルエンサーアカウント 5 個

### インフルエンサーアカウント #1

- **Email**: `influencer-test-01@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `influencer_test_01`
- **Display Name**: `テストインフルエンサー01`
- **Role**: インフルエンサー
- **Stats**:
  - 総収益: ¥150,000
  - 完了通話数: 25
  - 平均評価: 4.9

### インフルエンサーアカウント #2

- **Email**: `influencer-test-02@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `influencer_test_02`
- **Display Name**: `テストインフルエンサー02`
- **Role**: インフルエンサー
- **Stats**:
  - 総収益: ¥80,000
  - 完了通話数: 15
  - 平均評価: 4.7

### インフルエンサーアカウント #3

- **Email**: `influencer-test-03@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `influencer_test_03`
- **Display Name**: `テストインフルエンサー03`
- **Role**: インフルエンサー
- **Stats**:
  - 総収益: ¥120,000
  - 完了通話数: 20
  - 平均評価: 4.8

### インフルエンサーアカウント #4

- **Email**: `influencer-test-04@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `influencer_test_04`
- **Display Name**: `テストインフルエンサー04`
- **Role**: インフルエンサー
- **Stats**:
  - 総収益: ¥60,000
  - 完了通話数: 12
  - 平均評価: 4.6

### インフルエンサーアカウント #5

- **Email**: `influencer-test-05@oshicall.com`
- **Password**: `testpassword123`
- **Username**: `influencer_test_05`
- **Display Name**: `テストインフルエンサー05`
- **Role**: インフルエンサー
- **Stats**:
  - 総収益: ¥200,000
  - 完了通話数: 35
  - 平均評価: 4.9

## 使用方法

1. Staging 環境にアクセス
2. ログインページで上記の認証情報を使用
3. 各アカウントで異なる機能をテスト

## テストシナリオ別推奨アカウント

### 基本機能テスト

- **ファン**: `fan-test-01@oshicall.com`
- **インフルエンサー**: `influencer-test-01@oshicall.com`

### 入札・オークションテスト

- **ファン**: `fan-test-01@oshicall.com` ～ `fan-test-05@oshicall.com`
- **インフルエンサー**: `influencer-test-01@oshicall.com`

### ランキングテスト

- **インフルエンサー**: `influencer-test-01@oshicall.com` ～ `influencer-test-05@oshicall.com`
- **ファン**: `fan-test-01@oshicall.com` ～ `fan-test-10@oshicall.com`

### 負荷テスト

- **ファン**: 全 10 アカウント同時使用
- **インフルエンサー**: 全 5 アカウント同時使用

## 注意事項

- これらのアカウントはテスト専用です
- 本番環境では使用しないでください
- パスワードは簡単なものに設定されているため、セキュリティに注意してください
- テスト完了後は必要に応じてデータをクリーンアップしてください

## アカウント作成日

- 作成日: 2024 年 12 月現在
- 作成方法: Supabase ダッシュボード経由
- 総アカウント数: 15 個（ファン 10 個 + インフルエンサー 5 個）
