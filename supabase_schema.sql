-- =========================================
-- OshiCall Supabaseスキーマ定義
-- =========================================
-- このスクリプトは、OshiCallアプリケーションのデータベーススキーマを作成します。
-- Supabase認証を使用します。
-- =========================================

-- 既存のテーブルを削除（初期セットアップ時のみ）
-- DROP TABLE IF EXISTS purchased_slots CASCADE;
-- DROP TABLE IF EXISTS bids CASCADE;
-- DROP TABLE IF EXISTS auctions CASCADE;
-- DROP TABLE IF EXISTS call_slots CASCADE;
-- DROP TABLE IF EXISTS influencers CASCADE;
-- DROP TABLE IF EXISTS fans CASCADE;

-- =========================================
-- 1. Fansテーブル（ファン情報）
-- =========================================
CREATE TABLE IF NOT EXISTS fans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  stripe_customer_id VARCHAR(255) UNIQUE,
  has_payment_method BOOLEAN DEFAULT FALSE,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_calls_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fansテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_fans_auth_user_id ON fans(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_fans_stripe_customer_id ON fans(stripe_customer_id);

-- =========================================
-- 2. Influencersテーブル（インフルエンサー情報）
-- =========================================
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  stripe_account_id VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_calls_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Influencersテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_influencers_auth_user_id ON influencers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_influencers_stripe_account_id ON influencers(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_influencers_is_verified ON influencers(is_verified);

-- =========================================
-- 3. Call Slotsテーブル（通話枠情報）
-- =========================================
CREATE TABLE IF NOT EXISTS call_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  starting_price DECIMAL(10, 2) NOT NULL,
  minimum_bid_increment DECIMAL(10, 2) NOT NULL DEFAULT 100,
  is_published BOOLEAN DEFAULT TRUE,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT chk_price_positive CHECK (starting_price >= 0),
  CONSTRAINT chk_increment_positive CHECK (minimum_bid_increment > 0)
);

-- Call Slotsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_call_slots_influencer_id ON call_slots(influencer_id);
CREATE INDEX IF NOT EXISTS idx_call_slots_scheduled_start_time ON call_slots(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_call_slots_is_published ON call_slots(is_published);

-- =========================================
-- 4. Auctionsテーブル（オークション情報）
-- =========================================
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_slot_id UUID NOT NULL UNIQUE REFERENCES call_slots(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  current_highest_bid DECIMAL(10, 2),
  current_winner_id UUID REFERENCES fans(id) ON DELETE SET NULL,
  total_bids_count INTEGER DEFAULT 0,
  unique_bidders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_auction_status CHECK (status IN ('draft', 'scheduled', 'active', 'ended', 'cancelled')),
  CONSTRAINT chk_auction_times CHECK (end_time > start_time)
);

-- Auctionsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_auctions_call_slot_id ON auctions(call_slot_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_current_winner_id ON auctions(current_winner_id);

-- =========================================
-- 5. Bidsテーブル（入札情報）
-- =========================================
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  is_autobid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_bid_amount_positive CHECK (bid_amount > 0)
);

-- Bidsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_fan_id ON bids(fan_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_stripe_payment_intent_id ON bids(stripe_payment_intent_id);

-- =========================================
-- 6. Purchased Slotsテーブル（購入済み通話枠）
-- =========================================
CREATE TABLE IF NOT EXISTS purchased_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_slot_id UUID NOT NULL REFERENCES call_slots(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  fan_id UUID NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  winning_bid_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  influencer_payout DECIMAL(10, 2) NOT NULL,
  call_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  video_call_room_id VARCHAR(255),
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT chk_purchased_call_status CHECK (call_status IN ('pending', 'ready', 'in_progress', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT chk_purchased_amounts_positive CHECK (
    winning_bid_amount >= 0 AND 
    platform_fee >= 0 AND 
    influencer_payout >= 0
  )
);

-- Purchased Slotsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_purchased_slots_fan_id ON purchased_slots(fan_id);
CREATE INDEX IF NOT EXISTS idx_purchased_slots_influencer_id ON purchased_slots(influencer_id);
CREATE INDEX IF NOT EXISTS idx_purchased_slots_call_status ON purchased_slots(call_status);
CREATE INDEX IF NOT EXISTS idx_purchased_slots_purchased_at ON purchased_slots(purchased_at DESC);

-- =========================================
-- トリガー関数: updated_at自動更新
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの設定
CREATE TRIGGER update_fans_updated_at
  BEFORE UPDATE ON fans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_slots_updated_at
  BEFORE UPDATE ON call_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- Row Level Security (RLS) ポリシー
-- =========================================

-- RLSを有効化
ALTER TABLE fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_slots ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Everyone can view published influencer profiles" 
  ON influencers FOR SELECT 
  USING (is_verified = true);

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

-- =========================================
-- 初期データ（オプション）
-- =========================================
-- 必要に応じてテストデータを追加してください

-- =========================================
-- 完了
-- =========================================
-- スキーマの作成が完了しました。
-- Supabaseダッシュボードで以下を確認してください：
-- 1. すべてのテーブルが作成されていること
-- 2. インデックスが適用されていること
-- 3. RLSポリシーが有効になっていること
-- 4. トリガーが設定されていること
-- =========================================

