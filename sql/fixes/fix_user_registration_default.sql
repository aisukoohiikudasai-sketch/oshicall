-- ユーザー登録時のデフォルト値を確実にファンに設定
-- インフルエンサーとして誤登録される問題を解決

-- 1. 既存のデフォルト値を確認
SELECT 
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_fan', 'is_influencer');

-- 2. is_fanカラムのデフォルト値をTRUEに設定
ALTER TABLE users ALTER COLUMN is_fan SET DEFAULT TRUE;

-- 3. is_influencerカラムのデフォルト値をFALSEに設定
ALTER TABLE users ALTER COLUMN is_influencer SET DEFAULT FALSE;

-- 4. 既存のユーザーで両方のフラグがfalseの場合はファンに設定
UPDATE users 
SET is_fan = TRUE, is_influencer = FALSE
WHERE is_fan = FALSE AND is_influencer = FALSE;

-- 5. チェック制約を追加（オプション）
-- ユーザーは必ずファンまたはインフルエンサーのいずれかである必要がある
-- 既存の制約を確認してから追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_user_type' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_user_type 
    CHECK (is_fan = TRUE OR is_influencer = TRUE);
  ELSE
    RAISE NOTICE '制約 check_user_type は既に存在します';
  END IF;
END $$;

-- 6. 新規ユーザー登録時のトリガー関数を作成
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

-- 7. トリガーを作成（既存のトリガーを削除してから作成）
DROP TRIGGER IF EXISTS ensure_fan_default_trigger ON users;
CREATE TRIGGER ensure_fan_default_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_fan_default();

-- 8. 修正後のデフォルト値を確認
SELECT 
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('is_fan', 'is_influencer');

-- 9. 完了メッセージ
SELECT 'ユーザー登録デフォルト値修正完了' as status;
