-- オークション終了処理の結果を確認

-- 1. 落札情報を確認
SELECT 
  ps.id as purchased_slot_id,
  ps.call_slot_id,
  ps.auction_id,
  ps.winning_bid_amount,
  ps.platform_fee,
  ps.influencer_payout,
  ps.call_status,
  ps.purchased_at,
  cs.title,
  fan.display_name as buyer_name,
  inf.display_name as influencer_name
FROM purchased_slots ps
JOIN call_slots cs ON ps.call_slot_id = cs.id
JOIN users fan ON ps.fan_user_id = fan.id
JOIN users inf ON ps.influencer_user_id = inf.id
ORDER BY ps.purchased_at DESC
LIMIT 5;

-- 2. 決済トランザクションを確認
SELECT 
  pt.id,
  pt.purchased_slot_id,
  pt.stripe_payment_intent_id,
  pt.stripe_charge_id,
  pt.amount,
  pt.platform_fee,
  pt.influencer_payout,
  pt.status,
  pt.created_at
FROM payment_transactions pt
ORDER BY pt.created_at DESC
LIMIT 5;

-- 3. オークション状態を確認
SELECT 
  a.id as auction_id,
  a.status,
  a.current_highest_bid,
  a.winner_user_id,
  cs.title
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
WHERE a.status = 'ended'
ORDER BY a.updated_at DESC
LIMIT 5;

-- 4. ユーザー統計を確認
SELECT 
  display_name,
  is_fan,
  is_influencer,
  total_spent,
  total_calls_purchased,
  total_earnings,
  total_calls_completed
FROM users
WHERE total_spent > 0 OR total_earnings > 0
ORDER BY updated_at DESC;

-- 5. 入札履歴を確認
SELECT 
  b.id,
  b.auction_id,
  b.bid_amount,
  b.stripe_payment_intent_id,
  b.created_at,
  u.display_name as bidder_name
FROM bids b
JOIN users u ON b.user_id = u.id
WHERE b.auction_id = 'fbfaa915-dafe-4945-80f6-d9c66aa81282'
ORDER BY b.bid_amount DESC;

