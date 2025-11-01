-- フォロー機能の既存状態をチェックして修正するスクリプト

-- ステップ1: 現在の状態を確認
-- このクエリをSupabase SQLエディタで実行して、現在の状態を確認してください

-- テーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'follows'
) AS follows_table_exists;

-- ポリシーの確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'follows'
ORDER BY policyname;

-- インデックスの確認
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'follows'
ORDER BY indexname;

-- 関数の確認
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_follow_counts', 'is_following')
ORDER BY routine_name;

-- ビューの確認
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('user_followers', 'user_following')
ORDER BY table_name;

-- ステップ2: 問題がある場合は以下を実行
-- （上記の確認結果に基づいて、必要なものだけを実行）

-- ポリシーのみ削除して再作成する場合:
/*
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

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
*/

-- 関数のみ再作成する場合:
/*
DROP FUNCTION IF EXISTS get_follow_counts(UUID);
DROP FUNCTION IF EXISTS is_following(UUID, UUID);

CREATE OR REPLACE FUNCTION get_follow_counts(user_id UUID)
RETURNS TABLE(followers_count BIGINT, following_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM follows
    WHERE follows.follower_id = $1 AND follows.following_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ビューのみ再作成する場合:
/*
DROP VIEW IF EXISTS user_followers CASCADE;
DROP VIEW IF EXISTS user_following CASCADE;

CREATE OR REPLACE VIEW user_followers AS
SELECT
  f.following_id AS user_id,
  f.follower_id,
  u.display_name AS follower_name,
  u.profile_image_url AS follower_image,
  f.created_at AS followed_at
FROM follows f
JOIN users u ON f.follower_id = u.id;

CREATE OR REPLACE VIEW user_following AS
SELECT
  f.follower_id AS user_id,
  f.following_id,
  u.display_name AS following_name,
  u.profile_image_url AS following_image,
  f.created_at AS followed_at
FROM follows f
JOIN users u ON f.following_id = u.id;
*/
