-- Talk枠の時刻情報を確認
SELECT
    id,
    title,
    scheduled_start_time,
    scheduled_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' as scheduled_start_time_jst,
    created_at,
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo' as created_at_jst
FROM call_slots
ORDER BY created_at DESC
LIMIT 5;
