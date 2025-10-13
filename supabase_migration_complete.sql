-- =========================================
-- OshiCall Clerk→Supabase認証 完全移行スクリプト
-- =========================================
-- このスクリプトは既存のデータベースをClerkからSupabase認証に移行します。
-- 
-- ⚠️ 重要な注意事項 ⚠️
-- 1. 本番環境では必ずバックアップを取ってから実行してください
-- 2. 既存ユーザーのclerk_user_idをSupabase auth.users.idにマッピングする必要があります
-- 3. まずテスト環境で動作確認してから本番に適用してください
-- 4. ダウンタイムが発生する可能性があります
-- =========================================

-- =========================================
-- ステップ1: 既存の制約とインデックスを削除
-- =========================================

-- 外部キー制約を削除（後で再作成）
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_clerk_id_fkey;

-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_influencers_clerk_user_id;
DROP INDEX IF EXISTS idx_fans_clerk_user_id;

-- =========================================
-- ステップ2: influencersテーブルの列を変更
-- =========================================

-- clerk_user_idのデータ型をUUIDに変更する準備
-- 注意: Clerk IDは文字列なので、既存データがある場合は手動でマッピングが必要です

-- 一時列を追加
ALTER TABLE influencers ADD COLUMN auth_user_id_temp UUID;

-- ⚠️ ここで既存のclerk_user_idをSupabase auth.users.idにマッピングする必要があります
-- 例: 
-- UPDATE influencers 
-- SET auth_user_id_temp = 'corresponding-supabase-auth-uuid'
-- WHERE clerk_user_id = 'clerk-user-id';

-- 古い列を削除し、新しい列をリネーム
ALTER TABLE influencers DROP COLUMN clerk_user_id;
ALTER TABLE influencers RENAME COLUMN auth_user_id_temp TO auth_user_id;

-- NOT NULL制約と外部キー制約を追加
ALTER TABLE influencers 
  ALTER COLUMN auth_user_id SET NOT NULL,
  ADD CONSTRAINT influencers_auth_user_id_fkey 
    FOREIGN KEY (auth_user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT influencers_auth_user_id_unique 
    UNIQUE (auth_user_id);

-- =========================================
-- ステップ3: fansテーブルの列を変更
-- =========================================

-- 一時列を追加
ALTER TABLE fans ADD COLUMN auth_user_id_temp UUID;

-- ⚠️ ここで既存のclerk_user_idをSupabase auth.users.idにマッピングする必要があります
-- 例:
-- UPDATE fans 
-- SET auth_user_id_temp = 'corresponding-supabase-auth-uuid'
-- WHERE clerk_user_id = 'clerk-user-id';

-- 古い列を削除し、新しい列をリネーム
ALTER TABLE fans DROP COLUMN clerk_user_id;
ALTER TABLE fans RENAME COLUMN auth_user_id_temp TO auth_user_id;

-- NOT NULL制約と外部キー制約を追加
ALTER TABLE fans 
  ALTER COLUMN auth_user_id SET NOT NULL,
  ADD CONSTRAINT fans_auth_user_id_fkey 
    FOREIGN KEY (auth_user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT fans_auth_user_id_unique 
    UNIQUE (auth_user_id);

-- =========================================
-- ステップ4: notificationsテーブルの列を変更
-- =========================================

-- 一時列を追加
ALTER TABLE notifications ADD COLUMN user_auth_id_temp UUID;

-- ⚠️ ここで既存のuser_clerk_idをSupabase auth.users.idにマッピングする必要があります
-- 例:
-- UPDATE notifications n
-- SET user_auth_id_temp = CASE 
--   WHEN n.user_type = 'fan' THEN (SELECT auth_user_id FROM fans WHERE clerk_user_id = n.user_clerk_id)
--   WHEN n.user_type = 'influencer' THEN (SELECT auth_user_id FROM influencers WHERE clerk_user_id = n.user_clerk_id)
-- END;

-- 古い列を削除し、新しい列をリネーム
ALTER TABLE notifications DROP COLUMN user_clerk_id;
ALTER TABLE notifications RENAME COLUMN user_auth_id_temp TO user_auth_id;

-- NOT NULL制約と外部キー制約を追加
ALTER TABLE notifications 
  ALTER COLUMN user_auth_id SET NOT NULL,
  ADD CONSTRAINT notifications_user_auth_id_fkey 
    FOREIGN KEY (user_auth_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- =========================================
-- ステップ5: インデックスの再作成
-- =========================================

CREATE INDEX idx_influencers_auth_user ON influencers(auth_user_id);
CREATE INDEX idx_fans_auth_user ON fans(auth_user_id);
CREATE INDEX idx_notifications_user ON notifications(user_auth_id, is_read, created_at DESC);

-- =========================================
-- ステップ6: ビューの再作成
-- =========================================

-- 古いビューを削除
DROP VIEW IF EXISTS user_purchased_calls_view;

-- 新しいビューを作成
CREATE VIEW user_purchased_calls_view AS
SELECT 
  ps.id as purchased_slot_id,
  ps.call_status,
  ps.winning_bid_amount,
  ps.call_started_at,
  ps.call_ended_at,
  ps.video_call_room_id,
  cs.title,
  cs.scheduled_start_time,
  cs.duration_minutes,
  i.id as influencer_id,
  i.display_name as influencer_name,
  i.profile_image_url as influencer_image,
  f.id as fan_id,
  f.auth_user_id as fan_auth_id,
  r.rating,
  r.comment as review_comment
FROM purchased_slots ps
JOIN call_slots cs ON ps.call_slot_id = cs.id
JOIN influencers i ON ps.influencer_id = i.id
JOIN fans f ON ps.fan_id = f.id
LEFT JOIN reviews r ON ps.id = r.purchased_slot_id
ORDER BY cs.scheduled_start_time DESC;

-- =========================================
-- ステップ7: RLSポリシーの更新
-- =========================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own influencer profile" ON influencers;
DROP POLICY IF EXISTS "Users can update their own influencer profile" ON influencers;
DROP POLICY IF EXISTS "Users can insert their own influencer profile" ON influencers;
DROP POLICY IF EXISTS "Everyone can view verified influencer profiles" ON influencers;

DROP POLICY IF EXISTS "Users can view their own fan profile" ON fans;
DROP POLICY IF EXISTS "Users can update their own fan profile" ON fans;
DROP POLICY IF EXISTS "Users can insert their own fan profile" ON fans;

DROP POLICY IF EXISTS "Everyone can view published call slots" ON call_slots;
DROP POLICY IF EXISTS "Influencers can manage their own call slots" ON call_slots;

DROP POLICY IF EXISTS "Everyone can view auctions" ON auctions;

DROP POLICY IF EXISTS "Fans can view their own bids" ON bids;
DROP POLICY IF EXISTS "Fans can insert their own bids" ON bids;

DROP POLICY IF EXISTS "Fans can view their own purchased slots" ON purchased_slots;
DROP POLICY IF EXISTS "Influencers can view their own purchased slots" ON purchased_slots;

DROP POLICY IF EXISTS "Users can view their related payment transactions" ON payment_transactions;

DROP POLICY IF EXISTS "Everyone can view public reviews" ON reviews;
DROP POLICY IF EXISTS "Fans can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Fans can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Fans can update their own reviews" ON reviews;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- RLSを有効化（既に有効な場合はスキップされます）
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 新しいポリシーを作成
-- Influencersテーブル
CREATE POLICY "Users can view their own influencer profile" 
  ON influencers FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own influencer profile" 
  ON influencers FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own influencer profile" 
  ON influencers FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Everyone can view verified influencer profiles" 
  ON influencers FOR SELECT 
  USING (is_verified = true);

-- Fansテーブル
CREATE POLICY "Users can view their own fan profile" 
  ON fans FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own fan profile" 
  ON fans FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own fan profile" 
  ON fans FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

-- Call Slotsテーブル
CREATE POLICY "Everyone can view published call slots" 
  ON call_slots FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Influencers can manage their own call slots" 
  ON call_slots FOR ALL 
  USING (
    influencer_id IN (
      SELECT id FROM influencers WHERE auth_user_id = auth.uid()
    )
  );

-- Auctionsテーブル
CREATE POLICY "Everyone can view auctions" 
  ON auctions FOR SELECT 
  USING (true);

-- Bidsテーブル
CREATE POLICY "Fans can view their own bids" 
  ON bids FOR SELECT 
  USING (
    fan_id IN (
      SELECT id FROM fans WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Fans can insert their own bids" 
  ON bids FOR INSERT 
  WITH CHECK (
    fan_id IN (
      SELECT id FROM fans WHERE auth_user_id = auth.uid()
    )
  );

-- Purchased Slotsテーブル
CREATE POLICY "Fans can view their own purchased slots" 
  ON purchased_slots FOR SELECT 
  USING (
    fan_id IN (
      SELECT id FROM fans WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Influencers can view their own purchased slots" 
  ON purchased_slots FOR SELECT 
  USING (
    influencer_id IN (
      SELECT id FROM influencers WHERE auth_user_id = auth.uid()
    )
  );

-- Payment Transactionsテーブル
CREATE POLICY "Users can view their related payment transactions" 
  ON payment_transactions FOR SELECT 
  USING (
    purchased_slot_id IN (
      SELECT id FROM purchased_slots 
      WHERE fan_id IN (SELECT id FROM fans WHERE auth_user_id = auth.uid())
         OR influencer_id IN (SELECT id FROM influencers WHERE auth_user_id = auth.uid())
    )
  );

-- Reviewsテーブル
CREATE POLICY "Everyone can view public reviews" 
  ON reviews FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Fans can view their own reviews" 
  ON reviews FOR SELECT 
  USING (
    fan_id IN (
      SELECT id FROM fans WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Fans can insert their own reviews" 
  ON reviews FOR INSERT 
  WITH CHECK (
    fan_id IN (
      SELECT id FROM fans WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Fans can update their own reviews" 
  ON reviews FOR UPDATE 
  USING (
    fan_id IN (
      SELECT id FROM fans WHERE auth_user_id = auth.uid()
    )
  );

-- Notificationsテーブル
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (user_auth_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (user_auth_id = auth.uid());

-- =========================================
-- ステップ8: 確認クエリ
-- =========================================

-- テーブル構造を確認
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name IN ('influencers', 'fans', 'notifications')
-- ORDER BY table_name, ordinal_position;

-- 外部キー制約を確認
-- SELECT 
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_name IN ('influencers', 'fans', 'notifications');

-- =========================================
-- 完了
-- =========================================
-- 移行スクリプトの実行が完了しました。
-- 
-- ⚠️ 重要: データマッピングの実施 ⚠️
-- このスクリプトを実行する前に、以下のステップを完了してください：
-- 
-- 1. Supabaseでユーザー認証を有効化
-- 2. 既存ユーザーをSupabase Authに移行（またはユーザーに再登録を依頼）
-- 3. clerk_user_idとauth.users.idのマッピングテーブルを作成
-- 4. ステップ2、3、4のコメントアウトされたUPDATE文を実行
-- 5. データの整合性を確認
-- 
-- 確認事項:
-- - すべてのテーブルでauth_user_id列が存在すること
-- - 外部キー制約が正しく設定されていること
-- - RLSポリシーが適用されていること
-- - ビューが正しく動作すること
-- =========================================

