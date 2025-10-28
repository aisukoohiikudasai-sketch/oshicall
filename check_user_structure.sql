-- usersテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('id', 'auth_user_id')
ORDER BY ordinal_position;

-- サンプルユーザーデータを確認
SELECT id, auth_user_id, display_name, email, is_fan, is_influencer
FROM users
LIMIT 5;
