-- =========================================
-- インフルエンサー承認機能の追加
-- =========================================
-- このスクリプトはインフルエンサーへの切り替えを
-- 運営承認制にするための変更を行います。
-- =========================================

-- ステップ1: fansテーブルに承認フラグを追加
ALTER TABLE fans 
  ADD COLUMN can_be_influencer BOOLEAN DEFAULT FALSE;

-- ステップ2: インデックスを追加（検索効率化）
CREATE INDEX idx_fans_can_be_influencer ON fans(can_be_influencer) WHERE can_be_influencer = TRUE;

-- =========================================
-- 運営用: インフルエンサー承認SQL
-- =========================================

-- 【使用方法】
-- 以下のSQLをSupabase SQL Editorで実行して、
-- 特定のユーザーにインフルエンサー権限を付与します。

-- 方法1: メールアドレスで承認
-- UPDATE fans 
-- SET can_be_influencer = TRUE 
-- WHERE auth_user_id = (
--   SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- 方法2: ユーザーIDで承認
-- UPDATE fans 
-- SET can_be_influencer = TRUE 
-- WHERE id = 'fan-uuid-here';

-- 方法3: 表示名で承認
-- UPDATE fans 
-- SET can_be_influencer = TRUE 
-- WHERE display_name = 'ユーザー名';

-- =========================================
-- 運営用: 承認状況の確認
-- =========================================

-- 承認済みユーザーの一覧
-- SELECT 
--   f.id,
--   f.display_name,
--   u.email,
--   f.can_be_influencer,
--   f.created_at,
--   CASE 
--     WHEN EXISTS (SELECT 1 FROM influencers WHERE auth_user_id = f.auth_user_id)
--     THEN 'インフルエンサー登録済み'
--     ELSE '未登録'
--   END as influencer_status
-- FROM fans f
-- JOIN auth.users u ON f.auth_user_id = u.id
-- WHERE f.can_be_influencer = TRUE
-- ORDER BY f.created_at DESC;

-- 承認リクエスト待ちユーザー（必要に応じて実装）
-- SELECT 
--   f.id,
--   f.display_name,
--   u.email,
--   f.created_at
-- FROM fans f
-- JOIN auth.users u ON f.auth_user_id = u.id
-- WHERE f.can_be_influencer = FALSE
-- ORDER BY f.created_at DESC;

-- =========================================
-- 運営用: 承認の取り消し
-- =========================================

-- インフルエンサー権限を取り消す（メールアドレス指定）
-- UPDATE fans 
-- SET can_be_influencer = FALSE 
-- WHERE auth_user_id = (
--   SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- 既にインフルエンサーになっているユーザーの場合は
-- influencersテーブルからも削除が必要
-- DELETE FROM influencers 
-- WHERE auth_user_id = (
--   SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- =========================================
-- 完了
-- =========================================
-- 設定が完了しました。
-- 
-- 次のステップ:
-- 1. テストユーザーで承認フラグを立てる
-- 2. アプリケーション側のコードを更新
-- 3. UIで承認状態を確認
-- =========================================

