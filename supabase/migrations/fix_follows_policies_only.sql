-- フォローテーブルのポリシーのみを修正するスクリプト
-- エラー「policy "Anyone can view follows" for table "follows" already exists」が出た場合に使用

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

-- RLSが有効か確認して有効化
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ポリシーを再作成
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- 確認クエリ（実行後にこれで確認できます）
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'follows'
ORDER BY policyname;
