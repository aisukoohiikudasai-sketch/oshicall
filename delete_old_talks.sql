-- 既存のTalk枠とその関連データを削除
-- ※本番環境では注意して実行してください

-- 1. まず現在のTalk枠を確認
SELECT
    cs.id,
    cs.title,
    cs.scheduled_start_time,
    cs.created_at,
    a.id as auction_id
FROM call_slots cs
LEFT JOIN auctions a ON a.call_slot_id = cs.id
ORDER BY cs.created_at DESC;

-- 2. 削除実行（コメントを外して実行）
-- -- bidsを削除（外部キー制約のため）
-- DELETE FROM bids
-- WHERE auction_id IN (
--     SELECT id FROM auctions
--     WHERE call_slot_id IN (
--         SELECT id FROM call_slots
--     )
-- );
--
-- -- purchased_talksを削除（外部キー制約のため）
-- DELETE FROM purchased_talks
-- WHERE call_slot_id IN (
--     SELECT id FROM call_slots
-- );
--
-- -- auctionsを削除（外部キー制約のため）
-- DELETE FROM auctions
-- WHERE call_slot_id IN (
--     SELECT id FROM call_slots
-- );
--
-- -- 最後にcall_slotsを削除
-- DELETE FROM call_slots;
--
-- -- 確認
-- SELECT COUNT(*) as remaining_call_slots FROM call_slots;
-- SELECT COUNT(*) as remaining_auctions FROM auctions;
-- SELECT COUNT(*) as remaining_bids FROM bids;
-- SELECT COUNT(*) as remaining_purchased_talks FROM purchased_talks;
