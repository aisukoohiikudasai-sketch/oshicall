-- ユーザー登録時のデフォルト値を確実にファンに設定（安全版）
-- インフルエンサーとして誤登録される問題を解決

-- 1. 既存のデフォルト値を確認
SELECT 
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_fan', 'is_influencer');

-- 2. 既存の制約を確認
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%user_type%';

-- 3. 既存のトリガーを確認
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
  AND trigger_name LIKE '%fan%';

-- 4. is_fanカラムのデフォルト値をTRUEに設定
ALTER TABLE users ALTER COLUMN is_fan SET DEFAULT TRUE;

-- 5. is_influencerカラムのデフォルト値をFALSEに設定
ALTER TABLE users ALTER COLUMN is_influencer SET DEFAULT FALSE;

-- 6. 既存のユーザーで両方のフラグがfalseの場合はファンに設定
UPDATE users 
SET is_fan = TRUE, is_influencer = FALSE
WHERE is_fan = FALSE AND is_influencer = FALSE;

-- 7. 新規ユーザー登録時のトリガー関数を作成（既存の関数を置き換え）
CREATE OR REPLACE FUNCTION ensure_fan_default()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規ユーザーは必ずファンとして登録
  IF NEW.is_fan IS NULL THEN
    NEW.is_fan := TRUE;
  END IF;
  
  IF NEW.is_influencer IS NULL THEN
    NEW.is_influencer := FALSE;
  END IF;
  
  -- 両方のフラグがfalseの場合はファンに設定
  IF NEW.is_fan = FALSE AND NEW.is_influencer = FALSE THEN
    NEW.is_fan := TRUE;
    NEW.is_influencer := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. トリガーを作成（既存のトリガーを削除してから作成）
DROP TRIGGER IF EXISTS ensure_fan_default_trigger ON users;
CREATE TRIGGER ensure_fan_default_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_fan_default();

-- 9. 修正後のデフォルト値を確認
SELECT 
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_fan', 'is_influencer');

-- 10. 最近作成されたユーザーを確認
SELECT 
  id,
  auth_user_id,
  display_name,
  is_fan,
  is_influencer,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 11. 完了メッセージ
SELECT 'ユーザー登録デフォルト値修正完了（安全版）' as status;
