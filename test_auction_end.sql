-- ステップ1: 現在アクティブなオークションと入札を確認
SELECT 
  a.id as auction_id,
  a.call_slot_id,
  a.end_time,
  a.status,
  a.current_highest_bid,
  cs.title,
  COUNT(b.id) as bid_count
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
LEFT JOIN bids b ON b.auction_id = a.id
WHERE a.status = 'active'
GROUP BY a.id, a.call_slot_id, a.end_time, a.status, a.current_highest_bid, cs.title
ORDER BY a.created_at DESC;

-- ステップ2: 最新の入札があるオークションの終了時刻を過去にする
UPDATE auctions
SET end_time = NOW() - INTERVAL '1 minute'
WHERE id = (
  SELECT b.auction_id 
  FROM bids b
  JOIN auctions a ON b.auction_id = a.id
  WHERE a.status = 'active'
  ORDER BY b.created_at DESC
  LIMIT 1
);

-- ステップ3: 終了したオークションを確認
SELECT 
  a.id as auction_id,
  a.call_slot_id,
  a.end_time,
  a.status,
  a.current_highest_bid,
  cs.title,
  (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count,
  (SELECT MAX(bid_amount) FROM bids WHERE auction_id = a.id) as max_bid
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
WHERE a.end_time < NOW()
  AND a.status = 'active'
ORDER BY a.end_time DESC;

