-- Google認証でインフルエンサーとして登録される問題の調査
-- データベースの設定とデータを確認

-- 1. usersテーブルの構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. usersテーブルの制約を確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- 3. usersテーブルのトリガーを確認
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 4. 最近作成されたユーザーを確認
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_fan,
  is_influencer,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. インフルエンサーとして登録されているユーザーを確認
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_fan,
  is_influencer,
  created_at
FROM users 
WHERE is_influencer = true 
ORDER BY created_at DESC;

-- 6. ファンとして登録されているユーザーを確認
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_fan,
  is_influencer,
  created_at
FROM users 
WHERE is_fan = true AND is_influencer = false
ORDER BY created_at DESC;

-- 7. 両方のフラグがtrueになっているユーザーを確認
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_fan,
  is_influencer,
  created_at
FROM users 
WHERE is_fan = true AND is_influencer = true
ORDER BY created_at DESC;

-- 8. 両方のフラグがfalseになっているユーザーを確認
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_fan,
  is_influencer,
  created_at
FROM users 
WHERE is_fan = false AND is_influencer = false
ORDER BY created_at DESC;

-- 9. デフォルト値の確認
SELECT 
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_fan', 'is_influencer');

-- 10. 最近のユーザー登録の詳細を確認
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_fan,
  is_influencer,
  created_at,
  updated_at
FROM users 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
