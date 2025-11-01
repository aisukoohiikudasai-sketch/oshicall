-- =========================================
-- データベース状態確認SQL
-- =========================================
-- 現在のデータベースの状態を確認します
-- =========================================

-- 1. テーブルの存在確認
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'users' THEN '✓ ユーザーテーブル'
    WHEN table_name = 'call_slots' THEN '✓ Talk枠テーブル'
    WHEN table_name = 'auctions' THEN '✓ オークションテーブル'
    ELSE table_name
  END as 説明
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('users', 'call_slots', 'auctions', 'fans', 'influencers')
ORDER BY table_name;

-- 2. ビューの存在確認
SELECT 
  table_name as view_name,
  '✓ ビュー作成済み' as 状態
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'active_auctions_view';

-- 3. ユーザー数を確認
SELECT 
  COUNT(*) as 総ユーザー数,
  COUNT(*) FILTER (WHERE is_fan = TRUE) as ファン数,
  COUNT(*) FILTER (WHERE is_influencer = TRUE) as インフルエンサー数,
  COUNT(*) FILTER (WHERE is_verified = TRUE) as 認証済み数
FROM users;

-- 4. Talk枠数を確認
SELECT 
  COUNT(*) as 総Talk枠数,
  COUNT(*) FILTER (WHERE is_published = TRUE) as 公開中,
  COUNT(*) FILTER (WHERE is_published = FALSE) as 非公開
FROM call_slots;

-- 5. オークション数を確認
SELECT 
  status as オークション状態,
  COUNT(*) as 件数
FROM auctions
GROUP BY status
ORDER BY status;

-- 6. active_auctions_view の内容を確認
SELECT 
  auction_id,
  title as Talk枠タイトル,
  influencer_name as インフルエンサー名,
  status as 状態,
  scheduled_start_time as 開始時刻,
  starting_price as 開始価格,
  current_highest_bid as 現在最高入札額
FROM active_auctions_view
ORDER BY scheduled_start_time
LIMIT 10;

-- 7. 現在ログインしているユーザーの情報
SELECT 
  id,
  display_name,
  is_fan,
  is_influencer,
  is_verified,
  created_at
FROM users
WHERE auth_user_id = auth.uid();

-- 8. 現在ログインしているユーザーのTalk枠
SELECT 
  cs.id,
  cs.title,
  cs.scheduled_start_time,
  cs.is_published,
  a.status as auction_status
FROM call_slots cs
LEFT JOIN auctions a ON cs.id = a.call_slot_id
WHERE cs.user_id IN (
  SELECT id FROM users WHERE auth_user_id = auth.uid()
)
ORDER BY cs.created_at DESC;

-- =========================================
-- 診断結果
-- =========================================
-- 上記のクエリ結果から以下を確認してください：
-- 
-- ✓ users テーブルが存在する
-- ✓ active_auctions_view ビューが存在する
-- ✓ 少なくとも1人のユーザーが存在する
-- ✓ is_influencer = TRUE のユーザーが存在する
-- ✓ 公開中のTalk枠が存在する
-- ✓ active状態のオークションが存在する
-- ✓ active_auctions_view に行が返される
-- 
-- もし active_auctions_view が空の場合：
-- → supabase_quick_test_data.sql を実行してテストデータを投入
-- =========================================

