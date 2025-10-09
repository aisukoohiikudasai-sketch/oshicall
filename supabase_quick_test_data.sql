-- =========================================
-- クイックテストデータ投入
-- =========================================
-- 既存ユーザーを使って簡単にTalk枠を作成します
-- 画像URLは後で置き換えてください
-- =========================================

-- ステップ1: 現在のユーザーをインフルエンサーに設定
UPDATE users 
SET 
  is_influencer = TRUE,
  is_verified = TRUE,
  bio = 'テストインフルエンサーです✨'
WHERE auth_user_id = auth.uid();

-- ステップ2: Talk枠を作成（3日後の18時）
DO $$
DECLARE
  v_user_id UUID;
  v_slot_id UUID;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 現在のユーザーIDを取得
  SELECT id INTO v_user_id 
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ユーザーが見つかりません。ログインしてください。';
  END IF;
  
  -- 開始時刻: 3日後の18時
  v_start_time := DATE_TRUNC('day', NOW() + INTERVAL '3 days') + INTERVAL '18 hours';
  -- 終了時刻: 開始24時間前（オークション終了）
  v_end_time := v_start_time - INTERVAL '24 hours';
  
  -- Talk枠を作成
  INSERT INTO call_slots (
    user_id,
    title,
    description,
    scheduled_start_time,
    duration_minutes,
    starting_price,
    minimum_bid_increment,
    is_published,
    thumbnail_url
  ) VALUES
  (
    v_user_id,
    'テストTalk：みんなでおしゃべり☀️',
    'これはテスト用のTalk枠です。実際のTalkではこのような説明文が入ります。',
    v_start_time,
    30,
    3000,
    100,
    true,
    '/images/talks/6.jpg'  -- 一時的にローカルパス（後でStorage URLに変更）
  )
  RETURNING id INTO v_slot_id;
  
  -- オークションを作成
  INSERT INTO auctions (
    call_slot_id,
    status,
    start_time,
    end_time
  ) VALUES
  (
    v_slot_id,
    'active',
    NOW(),
    v_end_time
  );
  
  RAISE NOTICE 'Talk枠を作成しました！';
  RAISE NOTICE 'Talk ID: %', v_slot_id;
  RAISE NOTICE '開始時刻: %', v_start_time;
  RAISE NOTICE 'オークション終了: %', v_end_time;
END $$;

-- ステップ3: 作成したTalk枠を確認
SELECT 
  cs.id,
  cs.title,
  cs.scheduled_start_time as Talk開始時刻,
  cs.starting_price as 開始価格,
  u.display_name as インフルエンサー名,
  a.status as オークション状態,
  a.end_time as オークション終了時刻
FROM call_slots cs
JOIN users u ON cs.user_id = u.id
LEFT JOIN auctions a ON cs.id = a.call_slot_id
WHERE u.auth_user_id = auth.uid()
ORDER BY cs.created_at DESC
LIMIT 5;

-- =========================================
-- 完了
-- =========================================
-- テストデータの投入が完了しました！
-- 
-- 次のステップ:
-- 1. アプリをリロード（Ctrl+R または Cmd+R）
-- 2. ホーム画面でTalk枠が表示されることを確認
-- 3. 画像が表示されない場合は、Supabase Storageに画像をアップロードして
--    thumbnail_url を更新してください
-- 
-- 画像URLの更新例:
-- UPDATE call_slots 
-- SET thumbnail_url = 'https://[your-project].supabase.co/storage/v1/object/public/talk-images/6.jpg'
-- WHERE id = '[call-slot-id]';
-- =========================================

