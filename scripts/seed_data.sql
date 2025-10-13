-- =========================================
-- OshiCall シードデータ投入
-- =========================================
-- MockデータをDBに投入します
-- 
-- 前提条件:
-- 1. supabase_clean_reinstall.sql が実行済み
-- 2. Storageに画像がアップロード済み
-- 3. ユーザーが少なくとも1人登録済み
-- =========================================

-- ステップ1: インフルエンサーユーザーを作成
-- 注意: 実際のauth_user_idは手動で取得する必要があります

-- 例: テスト用にインフルエンサーを作成
-- まず、Supabase Authで10人のユーザーを作成してください
-- その後、以下のSQLでそのユーザーをインフルエンサーとして設定

-- テンプレート:
-- UPDATE users 
-- SET 
--   is_influencer = TRUE,
--   is_verified = TRUE,
--   display_name = 'あいり',
--   bio = '今日もお喋りしましょうね〜✨',
--   profile_image_url = 'https://[your-project].supabase.co/storage/v1/object/public/profile-images/1.jpg',
--   total_earnings = 185000,
--   total_calls_completed = 15,
--   average_rating = 4.8
-- WHERE auth_user_id = '[auth-user-id-here]';

-- =========================================
-- 簡易版: 既存ユーザーをインフルエンサーに変換
-- =========================================

-- 現在ログインしているユーザーをインフルエンサーに（テスト用）
-- 実際のプロジェクトでは個別に設定してください

-- 例: メールアドレスでユーザーを指定
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- ユーザー1: あいり
  SELECT id INTO v_user_id FROM users 
  WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'airi@example.com' LIMIT 1);
  
  IF v_user_id IS NOT NULL THEN
    UPDATE users 
    SET 
      is_influencer = TRUE,
      is_verified = TRUE,
      display_name = 'あいり',
      bio = '今日もお喋りしましょうね〜✨',
      total_earnings = 185000,
      total_calls_completed = 15,
      average_rating = 4.8
    WHERE id = v_user_id;
  END IF;
END $$;

-- =========================================
-- Talk枠データの投入
-- =========================================

-- 注意: influencer_user_id は実際のユーザーIDに置き換えてください
-- 以下は例です

-- INSERT INTO call_slots (
--   user_id,
--   title,
--   description,
--   scheduled_start_time,
--   duration_minutes,
--   starting_price,
--   minimum_bid_increment,
--   is_published,
--   thumbnail_url
-- ) VALUES
-- (
--   '[user-id-1]',
--   'みんなで元気チャージ☀️',
--   '疲れた心を癒やします♪悩み相談や愚痴聞きもOK！一緒に笑顔になりましょう〜',
--   '2025-10-15 18:00:00+09',
--   30,
--   3000,
--   100,
--   true,
--   'https://[your-project].supabase.co/storage/v1/object/public/talk-images/6.jpg'
-- );

-- =========================================
-- オークションの作成
-- =========================================

-- Talk枠作成後、対応するオークションを作成
-- 注意: call_slot_id は上で作成したTalk枠のIDに置き換え

-- INSERT INTO auctions (
--   call_slot_id,
--   status,
--   start_time,
--   end_time
-- ) VALUES
-- (
--   '[call-slot-id]',
--   'active',
--   NOW(),
--   '2025-10-14 18:00:00+09'  -- Talk開始24時間前
-- );

-- =========================================
-- 完了
-- =========================================
-- シードデータの投入が完了しました。
-- 
-- 次のステップ:
-- 1. アプリケーションでデータが表示されることを確認
-- 2. 必要に応じて追加データを投入
-- =========================================

