-- usersテーブルの構造を確認
-- emailカラムの存在を確認

-- 1. usersテーブルの全カラムを確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. emailカラムが存在するか確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name = 'email';

-- 3. 最近作成されたユーザーの構造を確認
SELECT 
  id,
  auth_user_id,
  display_name,
  is_fan,
  is_influencer,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 3;
