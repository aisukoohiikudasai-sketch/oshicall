-- purchased_slotsテーブルにDaily.co関連カラムを追加

-- video_call_room_id カラム（既に存在する可能性があるのでIF NOT EXISTSを使用）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchased_slots' AND column_name = 'video_call_room_id'
  ) THEN
    ALTER TABLE purchased_slots 
    ADD COLUMN video_call_room_id VARCHAR(255);
  END IF;
END $$;

-- 参加日時カラム
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchased_slots' AND column_name = 'influencer_joined_at'
  ) THEN
    ALTER TABLE purchased_slots 
    ADD COLUMN influencer_joined_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchased_slots' AND column_name = 'fan_joined_at'
  ) THEN
    ALTER TABLE purchased_slots 
    ADD COLUMN fan_joined_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 実際の通話時間
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchased_slots' AND column_name = 'call_actual_duration_minutes'
  ) THEN
    ALTER TABLE purchased_slots 
    ADD COLUMN call_actual_duration_minutes INTEGER;
  END IF;
END $$;

-- 確認
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchased_slots' 
  AND column_name IN (
    'video_call_room_id', 
    'influencer_joined_at', 
    'fan_joined_at', 
    'call_actual_duration_minutes'
  )
ORDER BY column_name;

