-- ============================================
-- OshiCall クリーンインストール用スクリプト
-- Supabase認証対応版
-- ============================================
-- このスクリプトは既存のテーブルを全て削除してから、
-- 新しいスキーマを作成します。
-- 
-- ⚠️ 注意: このスクリプトは既存のデータを全て削除します！
-- データがない場合のみ実行してください。
-- ============================================

-- ============================================
-- ステップ1: 既存のテーブルとビューを削除
-- ============================================

-- ビューを削除（テーブルより先に削除する必要がある）
DROP VIEW IF EXISTS active_auctions_view CASCADE;
DROP VIEW IF EXISTS user_purchased_calls_view CASCADE;

-- テーブルを削除（依存関係の逆順）
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS purchased_slots CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS call_slots CASCADE;
DROP TABLE IF EXISTS influencers CASCADE;
DROP TABLE IF EXISTS fans CASCADE;

-- トリガー関数を削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_auction_highest_bid(UUID, DECIMAL, UUID) CASCADE;
DROP FUNCTION IF EXISTS finalize_auction(UUID) CASCADE;

-- 列挙型を削除
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS call_status CASCADE;
DROP TYPE IF EXISTS auction_status CASCADE;
DROP TYPE IF EXISTS user_type CASCADE;

-- ============================================
-- ステップ2: 列挙型定義
-- ============================================

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

-- ============================================
-- ステップ3: テーブル作成
-- ============================================

-- インフルエンサープロフィール
CREATE TABLE influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  stripe_account_id VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_calls_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ファンプロフィール
CREATE TABLE fans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  profile_image_url TEXT,
  stripe_customer_id VARCHAR(255) UNIQUE,
  has_payment_method BOOLEAN DEFAULT FALSE,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_calls_purchased INTEGER DEFAULT 0,
  can_be_influencer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 通話枠
CREATE TABLE call_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
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

-- オークション
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_slot_id UUID UNIQUE NOT NULL REFERENCES call_slots(id) ON DELETE CASCADE,
  status auction_status DEFAULT 'draft',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  current_highest_bid DECIMAL(10, 2),
  current_winner_id UUID REFERENCES fans(id),
  total_bids_count INTEGER DEFAULT 0,
  unique_bidders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_auction_period CHECK (end_time > start_time)
);

-- 入札履歴
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL CHECK (bid_amount > 0),
  is_autobid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 購入済み通話枠
CREATE TABLE purchased_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_slot_id UUID NOT NULL REFERENCES call_slots(id) ON DELETE RESTRICT,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE RESTRICT,
  fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE RESTRICT,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE RESTRICT,
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

-- 決済トランザクション
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

-- レビュー
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchased_slot_id UUID UNIQUE NOT NULL REFERENCES purchased_slots(id) ON DELETE CASCADE,
  fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 通知
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type user_type NOT NULL,
  user_auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ステップ4: インデックス作成
-- ============================================

CREATE INDEX idx_influencers_auth_user ON influencers(auth_user_id);
CREATE INDEX idx_fans_auth_user ON fans(auth_user_id);
CREATE INDEX idx_fans_can_be_influencer ON fans(can_be_influencer) WHERE can_be_influencer = TRUE;

CREATE INDEX idx_call_slots_influencer ON call_slots(influencer_id);
CREATE INDEX idx_call_slots_scheduled_time ON call_slots(scheduled_start_time);
CREATE INDEX idx_call_slots_published ON call_slots(is_published, scheduled_start_time);

CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time) WHERE status IN ('scheduled', 'active');
CREATE INDEX idx_auctions_call_slot ON auctions(call_slot_id);

CREATE INDEX idx_bids_auction_created ON bids(auction_id, created_at DESC);
CREATE INDEX idx_bids_fan ON bids(fan_id);
CREATE INDEX idx_bids_amount ON bids(auction_id, bid_amount DESC);

CREATE INDEX idx_purchased_slots_fan ON purchased_slots(fan_id);
CREATE INDEX idx_purchased_slots_influencer ON purchased_slots(influencer_id);
CREATE INDEX idx_purchased_slots_status ON purchased_slots(call_status);

CREATE INDEX idx_notifications_user ON notifications(user_auth_id, is_read, created_at DESC);

-- ============================================
-- ステップ5: Row Level Security (RLS) 有効化
-- ============================================

ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ステップ6: RLSポリシー作成
-- ============================================

-- Influencersテーブルのポリシー
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

-- Fansテーブルのポリシー
CREATE POLICY "Users can view their own fan profile" 
  ON fans FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own fan profile" 
  ON fans FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own fan profile" 
  ON fans FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

-- Call Slotsテーブルのポリシー
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

-- Auctionsテーブルのポリシー
CREATE POLICY "Everyone can view auctions" 
  ON auctions FOR SELECT 
  USING (true);

-- Bidsテーブルのポリシー
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

-- Purchased Slotsテーブルのポリシー
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

-- Payment Transactionsテーブルのポリシー
CREATE POLICY "Users can view their related payment transactions" 
  ON payment_transactions FOR SELECT 
  USING (
    purchased_slot_id IN (
      SELECT id FROM purchased_slots 
      WHERE fan_id IN (SELECT id FROM fans WHERE auth_user_id = auth.uid())
         OR influencer_id IN (SELECT id FROM influencers WHERE auth_user_id = auth.uid())
    )
  );

-- Reviewsテーブルのポリシー
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

-- Notificationsテーブルのポリシー
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (user_auth_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (user_auth_id = auth.uid());

-- ============================================
-- ステップ7: ビュー作成
-- ============================================

-- アクティブなオークション一覧
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
  i.id as influencer_id,
  i.display_name as influencer_name,
  i.profile_image_url as influencer_image,
  i.average_rating
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
JOIN influencers i ON cs.influencer_id = i.id
WHERE a.status IN ('scheduled', 'active')
  AND cs.is_published = TRUE
ORDER BY a.end_time ASC;

-- ユーザーの購入済み通話一覧
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

-- ============================================
-- ステップ8: トリガー関数作成
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの設定
CREATE TRIGGER update_influencers_updated_at BEFORE UPDATE ON influencers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fans_updated_at BEFORE UPDATE ON fans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_slots_updated_at BEFORE UPDATE ON call_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ステップ9: RPC関数（ビジネスロジック）
-- ============================================

-- オークション最高入札額更新
CREATE OR REPLACE FUNCTION update_auction_highest_bid(
  p_auction_id UUID,
  p_bid_amount DECIMAL,
  p_fan_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE auctions
  SET 
    current_highest_bid = p_bid_amount,
    current_winner_id = p_fan_id,
    total_bids_count = total_bids_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_auction_id;
  
  -- unique_bidders_count の更新
  UPDATE auctions
  SET unique_bidders_count = (
    SELECT COUNT(DISTINCT fan_id)
    FROM bids
    WHERE auction_id = p_auction_id
  )
  WHERE id = p_auction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- オークション終了処理
CREATE OR REPLACE FUNCTION finalize_auction(p_auction_id UUID)
RETURNS TABLE(
  winner_fan_id UUID,
  winning_amount DECIMAL,
  call_slot_id UUID
) AS $$
DECLARE
  v_auction RECORD;
BEGIN
  -- オークション情報取得
  SELECT * INTO v_auction
  FROM auctions
  WHERE id = p_auction_id;
  
  IF v_auction.current_winner_id IS NULL THEN
    -- 入札なしの場合
    UPDATE auctions SET status = 'ended' WHERE id = p_auction_id;
    RETURN;
  END IF;
  
  -- purchased_slotsに記録
  INSERT INTO purchased_slots (
    call_slot_id,
    auction_id,
    fan_id,
    influencer_id,
    winning_bid_amount,
    platform_fee,
    influencer_payout
  )
  SELECT
    v_auction.call_slot_id,
    v_auction.id,
    v_auction.current_winner_id,
    cs.influencer_id,
    v_auction.current_highest_bid,
    v_auction.current_highest_bid * 0.20,
    v_auction.current_highest_bid * 0.80
  FROM call_slots cs
  WHERE cs.id = v_auction.call_slot_id;
  
  -- オークションステータス更新
  UPDATE auctions SET status = 'ended' WHERE id = p_auction_id;
  
  -- 結果を返す
  RETURN QUERY
  SELECT 
    v_auction.current_winner_id,
    v_auction.current_highest_bid,
    v_auction.call_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 完了
-- ============================================
-- クリーンインストールが完了しました！
-- 
-- 確認事項:
-- ✅ すべてのテーブルが作成されました
-- ✅ インデックスが設定されました
-- ✅ RLSポリシーが適用されました
-- ✅ ビューが作成されました
-- ✅ トリガーが設定されました
-- ✅ RPC関数が作成されました
-- 
-- 次のステップ:
-- 1. Supabase認証を有効化
-- 2. 環境変数を設定
-- 3. アプリケーションを起動
-- 4. テストユーザーで動作確認
-- ============================================

