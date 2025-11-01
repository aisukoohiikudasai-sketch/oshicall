-- 既存のTalk枠の開始時刻を修正
-- 現在時刻から20分後に設定
UPDATE call_slots
SET scheduled_start_time = NOW() + INTERVAL '20 minutes'
WHERE id IN (
    SELECT id FROM call_slots
    ORDER BY created_at DESC
    LIMIT 1
);

-- オークション終了時刻も修正（Talk開始の5分前）
UPDATE auctions
SET
    end_time = (
        SELECT scheduled_start_time - INTERVAL '5 minutes'
        FROM call_slots
        WHERE call_slots.id = auctions.call_slot_id
    ),
    auction_end_time = (
        SELECT scheduled_start_time - INTERVAL '5 minutes'
        FROM call_slots
        WHERE call_slots.id = auctions.call_slot_id
    )
WHERE call_slot_id IN (
    SELECT id FROM call_slots
    ORDER BY created_at DESC
    LIMIT 1
);

-- 確認
SELECT
    cs.id,
    cs.title,
    cs.scheduled_start_time,
    cs.scheduled_start_time AT TIME ZONE 'Asia/Tokyo' as scheduled_start_time_jst,
    a.end_time as auction_end_time,
    a.end_time AT TIME ZONE 'Asia/Tokyo' as auction_end_time_jst
FROM call_slots cs
LEFT JOIN auctions a ON a.call_slot_id = cs.id
ORDER BY cs.created_at DESC
LIMIT 3;
