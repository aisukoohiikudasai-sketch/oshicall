-- =========================================
-- オークションテーブルのRLSポリシー修正
-- =========================================
-- auctionsテーブルへのINSERTポリシーが不足していたため追加
-- =========================================

-- 既存のポリシーを確認
-- SELECT * FROM pg_policies WHERE tablename = 'auctions';

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Influencers can create auctions for their call slots" ON auctions;
DROP POLICY IF EXISTS "Influencers can update their auctions" ON auctions;

-- INSERTポリシーを追加
CREATE POLICY "Influencers can create auctions for their call slots" 
  ON auctions FOR INSERT 
  WITH CHECK (
    call_slot_id IN (
      SELECT cs.id FROM call_slots cs
      JOIN users u ON cs.user_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.is_influencer = TRUE
    )
  );

-- UPDATEポリシーも追加（オークション管理のため）
CREATE POLICY "Influencers can update their auctions" 
  ON auctions FOR UPDATE 
  USING (
    call_slot_id IN (
      SELECT cs.id FROM call_slots cs
      JOIN users u ON cs.user_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.is_influencer = TRUE
    )
  );

-- 確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'auctions'
ORDER BY cmd;

-- =========================================
-- 完了
-- =========================================
-- RLSポリシーが追加されました。
-- これでインフルエンサーがTalk枠作成時にオークションも作成できます。
-- =========================================

