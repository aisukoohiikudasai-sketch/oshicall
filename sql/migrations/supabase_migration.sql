-- =========================================
-- OshiTalk Supabase認証移行用SQLスクリプト
-- =========================================
-- このスクリプトは、ClerkからSupabase認証への移行を実施します。
-- 
-- 実行前の注意事項:
-- 1. 本番環境では必ずバックアップを取ってから実行してください
-- 2. 既存データがある場合は、clerk_user_id から auth_user_id へのマッピングを別途準備してください
-- 3. テスト環境で動作確認してから本番に適用してください
-- =========================================

-- Step 1: Influencersテーブルの列名変更
ALTER TABLE influencers 
  RENAME COLUMN clerk_user_id TO auth_user_id;

-- Step 2: Fansテーブルの列名変更
ALTER TABLE fans 
  RENAME COLUMN clerk_user_id TO auth_user_id;

-- Step 3: インデックスの再作成（既存のインデックスが存在する場合）
-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_influencers_clerk_user_id;
DROP INDEX IF EXISTS idx_fans_clerk_user_id;

-- 新しいインデックスを作成
CREATE INDEX idx_influencers_auth_user_id ON influencers(auth_user_id);
CREATE INDEX idx_fans_auth_user_id ON fans(auth_user_id);

-- Step 4: Row Level Security (RLS) ポリシーの更新
-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own influencer profile" ON influencers;
DROP POLICY IF EXISTS "Users can update their own influencer profile" ON influencers;
DROP POLICY IF EXISTS "Users can view their own fan profile" ON fans;
DROP POLICY IF EXISTS "Users can update their own fan profile" ON fans;

-- 新しいポリシーを作成
-- Influencersテーブルのポリシー
CREATE POLICY "Users can view their own influencer profile" 
  ON influencers FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own influencer profile" 
  ON influencers FOR UPDATE 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Everyone can view published influencer profiles" 
  ON influencers FOR SELECT 
  USING (is_verified = true);

-- Fansテーブルのポリシー
CREATE POLICY "Users can view their own fan profile" 
  ON fans FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own fan profile" 
  ON fans FOR UPDATE 
  USING (auth.uid() = auth_user_id);

-- Step 5: 外部キー制約の確認と更新（必要に応じて）
-- auth_user_idがSupabaseのauth.usersテーブルを参照する場合
-- 注意: この制約を追加すると、既存データがauth.usersに存在しない場合エラーになります
-- ALTER TABLE influencers 
--   ADD CONSTRAINT fk_influencers_auth_user 
--   FOREIGN KEY (auth_user_id) 
--   REFERENCES auth.users(id) 
--   ON DELETE CASCADE;

-- ALTER TABLE fans 
--   ADD CONSTRAINT fk_fans_auth_user 
--   FOREIGN KEY (auth_user_id) 
--   REFERENCES auth.users(id) 
--   ON DELETE CASCADE;

-- Step 6: トリガー関数の更新（updated_at自動更新）
-- 既存のトリガーがある場合は問題ありませんが、念のため確認
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成（既に存在する場合はスキップされます）
DROP TRIGGER IF EXISTS update_influencers_updated_at ON influencers;
CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fans_updated_at ON fans;
CREATE TRIGGER update_fans_updated_at
  BEFORE UPDATE ON fans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: 確認用クエリ（実行後に確認）
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'influencers' AND column_name = 'auth_user_id';

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'fans' AND column_name = 'auth_user_id';

-- =========================================
-- 完了
-- =========================================
-- スクリプトの実行が完了しました。
-- 以下を確認してください：
-- 1. influencersテーブルのauth_user_id列が存在すること
-- 2. fansテーブルのauth_user_id列が存在すること
-- 3. インデックスが正しく作成されていること
-- 4. RLSポリシーが適用されていること
-- =========================================

