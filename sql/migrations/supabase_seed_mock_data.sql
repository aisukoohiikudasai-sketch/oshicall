-- =========================================
-- モックデータ投入スクリプト
-- =========================================
-- mockData.ts のデータをDBに投入します
-- 
-- 注意: このスクリプトは外部キー制約をOFFにして実行します
-- テスト用データなので、auth.usersに実際のユーザーは存在しません
-- =========================================

-- ステップ1: 既存のモックデータを全削除
DELETE FROM notifications;
DELETE FROM reviews;
DELETE FROM payment_transactions;
DELETE FROM purchased_slots;
DELETE FROM bids;
DELETE FROM auctions;
DELETE FROM call_slots;
DELETE FROM users WHERE is_influencer = TRUE AND auth_user_id NOT IN (SELECT id FROM auth.users);

-- ステップ2: 外部キー制約チェックを一時的にOFFにする
SET session_replication_role = replica;

-- ステップ3: インフルエンサーユーザーを作成
INSERT INTO users (
  id,
  auth_user_id,
  display_name,
  bio,
  profile_image_url,
  is_fan,
  is_influencer,
  is_verified,
  total_earnings,
  total_calls_completed,
  average_rating
) VALUES
-- 1. あいり (HoneySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'あいり',
  '今日もお喋りしましょうね〜✨',
  '/images/talks/1.jpg',
  false,
  true,
  true,
  185000,
  15,
  4.8
),
-- 2. みく (PinkySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'みく',
  'こんにちは〜💕 今日の出来事聞かせて！',
  '/images/talks/2.jpg',
  false,
  true,
  true,
  245000,
  22,
  4.9
),
-- 3. ゆめか (PolaLight)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'ゆめか',
  '一緒にお茶しながらお喋りしませんか？✨',
  '/images/talks/3.jpg',
  false,
  true,
  true,
  220000,
  18,
  4.7
),
-- 4. りな (HoneySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'りな',
  '可愛い話たくさんしましょうね🎀',
  '/images/talks/4.jpg',
  false,
  true,
  true,
  125000,
  12,
  4.9
),
-- 5. かな (PolaLight)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'かな',
  '音楽の話で盛り上がりましょう🎸',
  '/images/talks/5.jpg',
  false,
  true,
  true,
  165000,
  14,
  4.6
),
-- 6. まい (PinkySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'まい',
  '一緒に笑顔になりましょう☀️',
  '/images/talks/6.jpg',
  false,
  true,
  true,
  195000,
  20,
  4.8
),
-- 7. えみ (HoneySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'えみ',
  '和風な話で盛り上がりましょう🌸',
  '/images/talks/7.jpg',
  false,
  true,
  true,
  135000,
  11,
  4.9
),
-- 8. れん (PolaLight)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'れん',
  'ダークな話で盛り上がりましょう🖤',
  '/images/talks/8.jpg',
  false,
  true,
  true,
  98000,
  9,
  4.7
),
-- 9. あや (PinkySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'あや',
  'ゲームの話で盛り上がりましょう🎮',
  '/images/talks/9.jpg',
  false,
  true,
  true,
  235000,
  19,
  4.8
),
-- 10. さき (HoneySpice)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'さき',
  'スイーツの話で盛り上がりましょう🍰',
  '/images/talks/10.jpg',
  false,
  true,
  true,
  175000,
  16,
  4.9
);

-- ステップ4: Talk枠とオークションを作成
DO $$
DECLARE
  v_user_ids UUID[];
  v_user_id UUID;
  v_slot_id UUID;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_auction_end TIMESTAMP WITH TIME ZONE;
  i INTEGER;
BEGIN
  -- 作成したユーザーのIDを取得
  SELECT ARRAY_AGG(id ORDER BY created_at DESC) INTO v_user_ids
  FROM users
  WHERE is_influencer = TRUE
  LIMIT 10;
  
  -- Talk枠1: あいり
  v_start_time := NOW() + INTERVAL '3 days' + INTERVAL '23 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[1], '', '今日もお喋りしましょうね♪', v_start_time, 30, 3000, 100, true, '/images/talk_details/T1.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 8500);
  
  -- Talk枠2: みく
  v_start_time := NOW() + INTERVAL '4 days' + INTERVAL '20 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[2], '', 'こんにちは〜💕 今日の出来事聞かせて！', v_start_time, 45, 4000, 100, true, '/images/talk_details/T2.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 12000);
  
  -- Talk枠3: ゆめか
  v_start_time := NOW() + INTERVAL '5 days' + INTERVAL '19 hours' + INTERVAL '30 minutes';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[3], '', '一緒にお茶しながらお喋りしませんか？✨', v_start_time, 60, 5000, 100, true, '/images/talk_details/T3.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 18000);
  
  -- Talk枠4: りな
  v_start_time := NOW() + INTERVAL '6 days' + INTERVAL '15 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[4], '', '可愛い話たくさんしましょうね🎀', v_start_time, 30, 3500, 100, true, '/images/talk_details/T4.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 9500);
  
  -- Talk枠5: かな
  v_start_time := NOW() + INTERVAL '7 days' + INTERVAL '21 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[5], '', '音楽の話で盛り上がりましょう🎸', v_start_time, 45, 4500, 100, true, '/images/talk_details/T5.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 13500);
  
  -- Talk枠6: まい
  v_start_time := NOW() + INTERVAL '8 days' + INTERVAL '18 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[6], 'みんなで元気チャージ☀️', '疲れた心を癒やします♪悩み相談や愚痴聞きもOK！一緒に笑顔になりましょう〜', v_start_time, 30, 3000, 100, true, '/images/talk_details/T6.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 7500);
  
  -- Talk枠7: えみ
  v_start_time := NOW() + INTERVAL '9 days' + INTERVAL '16 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[7], '和風お茶会タイム🌸', '着物を着てお茶会気分でお話ししましょう♪日本文化についても語り合いませんか？', v_start_time, 45, 4000, 100, true, '/images/talk_details/T7.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 11000);
  
  -- Talk枠8: れん
  v_start_time := NOW() + INTERVAL '10 days' + INTERVAL '22 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[8], 'ダークサイド語り🖤', 'ゴシック文化やダークな世界観について語り合いましょう...普通じゃつまらない人集まれ', v_start_time, 30, 3500, 100, true, '/images/talk_details/T8.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 8000);
  
  -- Talk枠9: あや
  v_start_time := NOW() + INTERVAL '11 days' + INTERVAL '20 hours' + INTERVAL '30 minutes';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[9], 'ゲーム実況配信🎮', 'みんなでゲームの話をしましょう！最新のFPSやRPGについて熱く語ろう〜', v_start_time, 45, 4500, 100, true, '/images/talk_details/T9.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 15500);
  
  -- Talk枠10: さき
  v_start_time := NOW() + INTERVAL '12 days' + INTERVAL '14 hours';
  v_auction_end := v_start_time - INTERVAL '24 hours';
  
  INSERT INTO call_slots (user_id, title, description, scheduled_start_time, duration_minutes, starting_price, minimum_bid_increment, is_published, thumbnail_url)
  VALUES (v_user_ids[10], 'スイーツ作り教室🍰', 'お菓子作りのコツを教えます♪一緒にレシピ交換しませんか？甘い時間を過ごしましょう〜', v_start_time, 60, 3500, 100, true, '/images/talk_details/T10.jpg')
  RETURNING id INTO v_slot_id;
  
  INSERT INTO auctions (call_slot_id, status, start_time, end_time, current_highest_bid)
  VALUES (v_slot_id, 'active', NOW(), v_auction_end, 10500);
  
  RAISE NOTICE '✅ モックデータの投入が完了しました！';
  RAISE NOTICE '   - インフルエンサー: 10人';
  RAISE NOTICE '   - Talk枠: 10件';
  RAISE NOTICE '   - オークション: 10件';
END $$;

-- ステップ5: 外部キー制約チェックを元に戻す
SET session_replication_role = DEFAULT;

-- ステップ6: 投入結果を確認
SELECT 
  u.display_name as インフルエンサー名,
  cs.title as Talk枠タイトル,
  cs.scheduled_start_time as 開始時刻,
  cs.starting_price as 開始価格,
  a.status as オークション状態,
  a.current_highest_bid as 現在入札額
FROM call_slots cs
JOIN users u ON cs.user_id = u.id
LEFT JOIN auctions a ON cs.id = a.call_slot_id
WHERE u.is_influencer = TRUE
ORDER BY cs.scheduled_start_time;

-- ステップ7: active_auctions_view を確認
SELECT 
  influencer_name,
  title,
  scheduled_start_time,
  starting_price,
  current_highest_bid,
  status
FROM active_auctions_view
ORDER BY scheduled_start_time
LIMIT 20;

-- =========================================
-- 完了
-- =========================================
-- モックデータの投入が完了しました！
-- 
-- 確認事項:
-- ✅ インフルエンサー: 10人作成
-- ✅ Talk枠: 10件作成
-- ✅ オークション: 10件作成（全てactive状態）
-- ✅ active_auctions_view に表示される
-- 
-- 次のステップ:
-- 1. アプリをリロード（Ctrl+R / Cmd+R）
-- 2. ホーム画面でTalk枠が10件表示されることを確認
-- 3. 各Talk枠の詳細が正しく表示されることを確認
-- 
-- 注意事項:
-- - auth_user_idは架空のUUID（実際のauth.usersに存在しない）
-- - これはテストデータのため、本番では使用しないでください
-- - 外部キー制約を削除しているため、認証機能は動作しません
-- - 本番データを投入する場合は、実際のauth.usersと連携してください
-- =========================================

