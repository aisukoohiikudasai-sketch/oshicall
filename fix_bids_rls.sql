-- bidsテーブルのRLSポリシーを修正
-- 問題: auth.uid()はauth.usersテーブルのIDだが、bids.user_idはusersテーブルのIDを参照
-- 解決: usersテーブル経由でauth_user_idをチェックする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own bids" ON bids;
DROP POLICY IF EXISTS "Users can insert their own bids" ON bids;
DROP POLICY IF EXISTS "Users can view bids for their auctions" ON bids;
DROP POLICY IF EXISTS "Influencers can view bids for their auctions" ON bids;

-- 1. ユーザーは自分の入札を表示できる
CREATE POLICY "Users can view their own bids"
  ON bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = bids.user_id
        AND users.auth_user_id = auth.uid()
    )
  );

-- 2. ユーザーは自分の入札を作成できる
CREATE POLICY "Users can insert their own bids"
  ON bids FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = bids.user_id
        AND users.auth_user_id = auth.uid()
    )
  );

-- 3. インフルエンサーは自分のオークションの入札を表示できる
CREATE POLICY "Influencers can view bids for their auctions"
  ON bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM call_slots cs
      INNER JOIN auctions a ON a.call_slot_id = cs.id
      INNER JOIN users u ON cs.user_id = u.id
      WHERE a.id = bids.auction_id
        AND u.auth_user_id = auth.uid()
    )
  );

-- RLSが有効になっているか確認
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- 確認用クエリ
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'bids';

