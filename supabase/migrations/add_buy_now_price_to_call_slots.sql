-- call_slotsテーブルに即決価格カラムを追加
ALTER TABLE call_slots
ADD COLUMN buy_now_price INTEGER DEFAULT NULL;

-- 即決価格は開始価格より高い必要がある制約を追加
ALTER TABLE call_slots
ADD CONSTRAINT valid_buy_now_price
CHECK (buy_now_price IS NULL OR buy_now_price > starting_price);

-- コメント追加
COMMENT ON COLUMN call_slots.buy_now_price IS '即決価格（円）。NULLの場合は即決価格なし';
