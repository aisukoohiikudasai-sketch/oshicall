-- フォロー機能のRLSポリシーを修正
-- 問題: auth.uid()とusers.idの不一致を解決

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

-- 修正版のポリシーを作成

-- ポリシー1: すべてのログインユーザーがフォロー情報を閲覧可能
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

-- ポリシー2: ユーザーが他のユーザーをフォロー可能
-- auth.uid()はauth.usersのidなので、users.auth_user_idと比較
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = follower_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- ポリシー3: ユーザーが自分のフォローを解除可能
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = follower_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- 確認クエリ
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'follows'
ORDER BY policyname;
