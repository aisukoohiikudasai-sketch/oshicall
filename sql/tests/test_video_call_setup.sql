-- ビデオ通話テスト用のセットアップ

-- 1. テスト対象のpurchased_slotを確認
SELECT 
  ps.id,
  ps.call_status,
  cs.scheduled_start_time,
  cs.title,
  (cs.scheduled_start_time - NOW()) as time_until_start
FROM purchased_slots ps
JOIN call_slots cs ON ps.call_slot_id = cs.id
WHERE ps.id = '1c6d8b01-6911-45e4-8363-e265e64a4a7f';

-- 2. scheduled_start_timeを10分後に設定（テスト用）
UPDATE call_slots
SET scheduled_start_time = NOW() + INTERVAL '10 minutes'
WHERE id = (
  SELECT call_slot_id 
  FROM purchased_slots 
  WHERE id = '1c6d8b01-6911-45e4-8363-e265e64a4a7f'
);

-- 3. 確認
SELECT 
  ps.id as purchased_slot_id,
  ps.call_status,
  cs.id as call_slot_id,
  cs.scheduled_start_time,
  cs.title,
  cs.duration_minutes,
  EXTRACT(EPOCH FROM (cs.scheduled_start_time - NOW())) / 60 as minutes_until_start
FROM purchased_slots ps
JOIN call_slots cs ON ps.call_slot_id = cs.id
WHERE ps.id = '1c6d8b01-6911-45e4-8363-e265e64a4a7f';

