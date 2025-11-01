-- =========================================
-- OshiTalk 完全クリーンインストール
-- =========================================
-- ⚠️ 警告: このスクリプトは全てのデータを削除します！
-- 既存のデータが全て失われますので、ご注意ください。
-- =========================================

-- ステップ1: 既存のビューを削除
DROP VIEW IF EXISTS active_auctions_view CASCADE;
DROP VIEW IF EXISTS user_purchased_calls_view CASCADE;

-- ステップ2: 既存のテーブルを削除（CASCADE付き）
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS purchased_slots CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS call_slots CASCADE;
DROP TABLE IF EXISTS influencers CASCADE;
DROP TABLE IF EXISTS fans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ステップ3: 既存の関数を削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_auction_highest_bid(UUID, DECIMAL, UUID) CASCADE;
DROP FUNCTION IF EXISTS finalize_auction(UUID) CASCADE;

-- ステップ4: 既存の列挙型を削除
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS call_status CASCADE;
DROP TYPE IF EXISTS auction_status CASCADE;
DROP TYPE IF EXISTS user_type CASCADE;

-- =========================================
-- ステップ5: 列挙型を再作成
-- =========================================

CREATE TYPE user_type AS ENUM ('influencer', 'fan');

CREATE TYPE auction_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'ended',
  'cancelled'
);

CREATE TYPE call_status AS ENUM (
  'pending',
  'ready',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded'
);

-- =========================================
-- ステップ6: 統合ユーザーテーブルを作成
-- =========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  
  -- 決済関連
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_account_id VARCHAR(255) UNIQUE,
  
  -- ユーザータイプフラグ
  is_fan BOOLEAN DEFAULT TRUE,
  is_influencer BOOLEAN DEFAULT FALSE,
  
  -- ファン統計
  has_payment_method BOOLEAN DEFAULT FALSE,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_calls_purchased INTEGER DEFAULT 0,
  
  -- インフルエンサー統計
  is_verified BOOLEAN DEFAULT FALSE,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_calls_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- 少なくとも1つはtrueである必要がある
  CONSTRAINT check_user_type CHECK (is_fan = TRUE OR is_influencer = TRUE)
);

-- インデックス
CREATE INDEX idx_users_auth_user ON users(auth_user_id);
CREATE INDEX idx_users_is_fan ON users(is_fan) WHERE is_fan = TRUE;
CREATE INDEX idx_users_is_influencer ON users(is_influencer) WHERE is_influencer = TRUE;
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_stripe_account ON users(stripe_account_id);

-- =========================================
-- ステップ7: 通話枠テーブル
-- =========================================

CREATE TABLE call_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  starting_price DECIMAL(10, 2) NOT NULL CHECK (starting_price >= 0),
  minimum_bid_increment DECIMAL(10, 2) DEFAULT 100 CHECK (minimum_bid_increment >= 0),
  is_published BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_scheduled_time CHECK (scheduled_start_time > created_at)
);

CREATE INDEX idx_call_slots_user ON call_slots(user_id);
CREATE INDEX idx_call_slots_scheduled_time ON call_slots(scheduled_start_time);
CREATE INDEX idx_call_slots_published ON call_slots(is_published, scheduled_start_time);

-- =========================================
-- ステップ8: オークションテーブル
-- =========================================

CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_slot_id UUID UNIQUE NOT NULL REFERENCES call_slots(id) ON DELETE CASCADE,
  status auction_status DEFAULT 'draft',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  current_highest_bid DECIMAL(10, 2),
  current_winner_id UUID REFERENCES users(id),
  total_bids_count INTEGER DEFAULT 0,
  unique_bidders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_auction_period CHECK (end_time > start_time)
);

CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time) WHERE status IN ('scheduled', 'active');
CREATE INDEX idx_auctions_call_slot ON auctions(call_slot_id);

-- =========================================
-- ステップ9: 入札テーブル
-- =========================================

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL CHECK (bid_amount > 0),
  is_autobid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bids_auction_created ON bids(auction_id, created_at DESC);
CREATE INDEX idx_bids_user ON bids(user_id);
CREATE INDEX idx_bids_amount ON bids(auction_id, bid_amount DESC);

-- =========================================
-- ステップ10: 購入済み通話枠テーブル
-- =========================================

CREATE TABLE purchased_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_slot_id UUID NOT NULL REFERENCES call_slots(id) ON DELETE RESTRICT,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE RESTRICT,
  fan_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  influencer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  winning_bid_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  influencer_payout DECIMAL(10, 2) NOT NULL,
  call_status call_status DEFAULT 'pending',
  video_call_room_id VARCHAR(255),
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(call_slot_id)
);

CREATE INDEX idx_purchased_slots_fan ON purchased_slots(fan_user_id);
CREATE INDEX idx_purchased_slots_influencer ON purchased_slots(influencer_user_id);
CREATE INDEX idx_purchased_slots_status ON purchased_slots(call_status);

-- =========================================
-- ステップ11: 決済トランザクションテーブル
-- =========================================

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchased_slot_id UUID NOT NULL REFERENCES purchased_slots(id) ON DELETE RESTRICT,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  influencer_payout DECIMAL(10, 2) NOT NULL,
  stripe_transfer_id VARCHAR(255),
  status payment_status DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ステップ12: レビューテーブル
-- =========================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchased_slot_id UUID UNIQUE NOT NULL REFERENCES purchased_slots(id) ON DELETE CASCADE,
  fan_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ステップ13: 通知テーブル
-- =========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- =========================================
-- ステップ14: Row Level Security (RLS)
-- =========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Everyone can view verified influencers" 
  ON users FOR SELECT 
  USING (is_influencer = TRUE AND is_verified = TRUE);

-- Call Slots RLS
CREATE POLICY "Everyone can view published call slots" 
  ON call_slots FOR SELECT 
  USING (is_published = TRUE);

CREATE POLICY "Influencers can manage their own call slots" 
  ON call_slots FOR ALL 
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid() AND is_influencer = TRUE
    )
  );

-- Auctions RLS
CREATE POLICY "Everyone can view auctions" 
  ON auctions FOR SELECT 
  USING (true);

CREATE POLICY "Influencers can create auctions for their call slots" 
  ON auctions FOR INSERT 
  WITH CHECK (
    call_slot_id IN (
      SELECT cs.id FROM call_slots cs
      JOIN users u ON cs.user_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.is_influencer = TRUE
    )
  );

CREATE POLICY "Influencers can update their auctions" 
  ON auctions FOR UPDATE 
  USING (
    call_slot_id IN (
      SELECT cs.id FROM call_slots cs
      JOIN users u ON cs.user_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.is_influencer = TRUE
    )
  );

-- Bids RLS
CREATE POLICY "Users can view their own bids" 
  ON bids FOR SELECT 
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Fans can insert bids" 
  ON bids FOR INSERT 
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid() AND is_fan = TRUE
    )
  );

-- Purchased Slots RLS
CREATE POLICY "Fans can view their purchased slots" 
  ON purchased_slots FOR SELECT 
  USING (
    fan_user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Influencers can view their purchased slots" 
  ON purchased_slots FOR SELECT 
  USING (
    influencer_user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Payment Transactions RLS
CREATE POLICY "Users can view their related payment transactions" 
  ON payment_transactions FOR SELECT 
  USING (
    purchased_slot_id IN (
      SELECT id FROM purchased_slots 
      WHERE fan_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
         OR influencer_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Reviews RLS
CREATE POLICY "Everyone can view public reviews" 
  ON reviews FOR SELECT 
  USING (is_public = TRUE);

CREATE POLICY "Users can view their own reviews" 
  ON reviews FOR SELECT 
  USING (
    fan_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR influencer_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Fans can insert reviews" 
  ON reviews FOR INSERT 
  WITH CHECK (
    fan_user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- =========================================
-- ステップ15: ビュー作成
-- =========================================

CREATE VIEW active_auctions_view AS
SELECT 
  a.id as auction_id,
  a.status,
  a.start_time,
  a.end_time,
  a.current_highest_bid,
  a.total_bids_count,
  cs.id as call_slot_id,
  cs.title,
  cs.description,
  cs.scheduled_start_time,
  cs.duration_minutes,
  cs.starting_price,
  cs.thumbnail_url,
  u.id as influencer_id,
  u.display_name as influencer_name,
  u.bio as influencer_bio,
  u.profile_image_url as influencer_image,
  u.average_rating,
  u.total_calls_completed,
  u.is_verified
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
JOIN users u ON cs.user_id = u.id
WHERE a.status IN ('scheduled', 'active')
  AND cs.is_published = TRUE
  AND u.is_influencer = TRUE
ORDER BY a.end_time ASC;

-- =========================================
-- ステップ16: トリガー関数作成
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_slots_updated_at BEFORE UPDATE ON call_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- ステップ17: RPC関数（ビジネスロジック）
-- =========================================

CREATE OR REPLACE FUNCTION update_auction_highest_bid(
  p_auction_id UUID,
  p_bid_amount DECIMAL,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE auctions
  SET 
    current_highest_bid = p_bid_amount,
    current_winner_id = p_user_id,
    total_bids_count = total_bids_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_auction_id;
  
  UPDATE auctions
  SET unique_bidders_count = (
    SELECT COUNT(DISTINCT user_id)
    FROM bids
    WHERE auction_id = p_auction_id
  )
  WHERE id = p_auction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION finalize_auction(p_auction_id UUID)
RETURNS TABLE(
  winner_user_id UUID,
  winning_amount DECIMAL,
  call_slot_id UUID
) AS $$
DECLARE
  v_auction RECORD;
BEGIN
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id;
  
  IF v_auction.current_winner_id IS NULL THEN
    UPDATE auctions SET status = 'ended' WHERE id = p_auction_id;
    RETURN;
  END IF;
  
  INSERT INTO purchased_slots (
    call_slot_id,
    auction_id,
    fan_user_id,
    influencer_user_id,
    winning_bid_amount,
    platform_fee,
    influencer_payout
  )
  SELECT
    v_auction.call_slot_id,
    v_auction.id,
    v_auction.current_winner_id,
    cs.user_id,
    v_auction.current_highest_bid,
    v_auction.current_highest_bid * 0.20,
    v_auction.current_highest_bid * 0.80
  FROM call_slots cs
  WHERE cs.id = v_auction.call_slot_id;
  
  UPDATE auctions SET status = 'ended' WHERE id = p_auction_id;
  
  RETURN QUERY
  SELECT 
    v_auction.current_winner_id,
    v_auction.current_highest_bid,
    v_auction.call_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- 完了
-- =========================================
-- クリーンインストールが完了しました！
-- 
-- 次のステップ:
-- 1. 新規登録してテスト
-- 2. インフルエンサー権限を付与:
--    UPDATE users SET is_influencer = TRUE WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
-- 3. ログアウト→ログイン
-- 4. インフルエンサーモードに切り替え
-- =========================================

