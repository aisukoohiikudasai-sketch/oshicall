-- フォロー機能用テーブルを一から作成するスクリプト
-- テーブルが存在しない場合に使用

-- ステップ1: followsテーブルの作成
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- 同じユーザーを複数回フォローできないように
  UNIQUE(follower_id, following_id),

  -- 自分自身をフォローできないようにチェック
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ステップ2: インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- ステップ3: RLSポリシーの有効化
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ステップ4: ポリシーの作成
-- 注意: ポリシーが既に存在する場合はエラーになるので、先に削除
DO $$
BEGIN
  -- ポリシーが存在する場合のみ削除
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'follows' AND policyname = 'Anyone can view follows'
  ) THEN
    DROP POLICY "Anyone can view follows" ON follows;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'follows' AND policyname = 'Users can follow others'
  ) THEN
    DROP POLICY "Users can follow others" ON follows;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'follows' AND policyname = 'Users can unfollow'
  ) THEN
    DROP POLICY "Users can unfollow" ON follows;
  END IF;
END $$;

-- ポリシー: すべてのログインユーザーがフォロー情報を閲覧可能
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

-- ポリシー: フォロワー本人のみがフォロー作成可能
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- ポリシー: フォロワー本人のみがフォロー解除可能
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- ステップ5: フォロワー数とフォロー中の数を取得する関数
CREATE OR REPLACE FUNCTION get_follow_counts(user_id UUID)
RETURNS TABLE(followers_count BIGINT, following_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ステップ6: フォローステータスを確認する関数
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM follows
    WHERE follows.follower_id = $1 AND follows.following_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ステップ7: フォロワーのリストを取得するビュー
CREATE OR REPLACE VIEW user_followers AS
SELECT
  f.following_id AS user_id,
  f.follower_id,
  u.display_name AS follower_name,
  u.profile_image_url AS follower_image,
  f.created_at AS followed_at
FROM follows f
JOIN users u ON f.follower_id = u.id;

-- ステップ8: フォロー中のリストを取得するビュー
CREATE OR REPLACE VIEW user_following AS
SELECT
  f.follower_id AS user_id,
  f.following_id,
  u.display_name AS following_name,
  u.profile_image_url AS following_image,
  f.created_at AS followed_at
FROM follows f
JOIN users u ON f.following_id = u.id;

-- ステップ9: コメント追加
COMMENT ON TABLE follows IS 'ユーザー間のフォロー関係を管理するテーブル';
COMMENT ON COLUMN follows.follower_id IS 'フォローする側のユーザーID';
COMMENT ON COLUMN follows.following_id IS 'フォローされる側のユーザーID（インフルエンサー）';

-- ステップ10: 作成確認
SELECT 'followsテーブルが正常に作成されました' AS status;

-- 確認クエリ
SELECT
  'Table' AS object_type,
  tablename AS object_name
FROM pg_tables
WHERE tablename = 'follows'

UNION ALL

SELECT
  'Policy' AS object_type,
  policyname AS object_name
FROM pg_policies
WHERE tablename = 'follows'

UNION ALL

SELECT
  'Index' AS object_type,
  indexname AS object_name
FROM pg_indexes
WHERE tablename = 'follows'

UNION ALL

SELECT
  'Function' AS object_type,
  routine_name AS object_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_follow_counts', 'is_following')

UNION ALL

SELECT
  'View' AS object_type,
  table_name AS object_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('user_followers', 'user_following')

ORDER BY object_type, object_name;
