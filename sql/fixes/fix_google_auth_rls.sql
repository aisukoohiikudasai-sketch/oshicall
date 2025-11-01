-- Google認証のためのRLS設定修正
-- ユーザー登録時の権限問題を解決

-- 1. usersテーブルのRLSポリシーを確認・修正
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- 新しいRLSポリシーを作成
-- ユーザーは自分のプロフィールを閲覧可能
CREATE POLICY "Users can view their own profile" ON users 
FOR SELECT USING (auth_user_id = auth.uid());

-- ユーザーは自分のプロフィールを更新可能
CREATE POLICY "Users can update their own profile" ON users 
FOR UPDATE USING (auth_user_id = auth.uid());

-- 認証済みユーザーは新しいプロフィールを作成可能（新規登録用）
CREATE POLICY "Authenticated users can create profile" ON users 
FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- 2. 認証状態の確認
-- 現在の認証設定を確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- 3. 認証済みユーザーの権限確認
-- 現在のユーザーがusersテーブルにアクセス可能かテスト
DO $$
BEGIN
  -- 認証済みユーザーの権限をテスト
  IF auth.uid() IS NOT NULL THEN
    RAISE NOTICE '認証済みユーザーID: %', auth.uid();
  ELSE
    RAISE NOTICE '認証されていません';
  END IF;
END $$;

-- 4. デバッグ用の関数（必要に応じて）
-- ユーザー登録時のエラーを詳細にログ出力
CREATE OR REPLACE FUNCTION debug_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'ユーザー挿入試行: auth_user_id=%, display_name=%, email=%', 
    NEW.auth_user_id, NEW.display_name, NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- デバッグ用トリガー（開発時のみ）
-- DROP TRIGGER IF EXISTS debug_user_insert_trigger ON users;
-- CREATE TRIGGER debug_user_insert_trigger
--   BEFORE INSERT ON users
--   FOR EACH ROW
--   EXECUTE FUNCTION debug_user_insert();

-- 5. 完了メッセージ
SELECT 'Google認証用RLS設定完了' as status;
