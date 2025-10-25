-- ============================================
-- Supabaseセキュリティエラー修正SQL v2
-- ============================================
-- 以下のエラーを修正します：
-- 1. active_auctions_view の Security Definer 設定
-- 2. call_logs テーブルの RLS 有効化
-- ============================================

-- ============================================
-- 1. active_auctions_view の Security Definer 設定を修正
-- ============================================

-- 既存のビューを削除
DROP VIEW IF EXISTS active_auctions_view;

-- SECURITY INVOKER でビューを再作成（デフォルト）
-- これにより、呼び出し元のユーザーの権限でビューが実行される
CREATE VIEW active_auctions_view AS
SELECT 
  a.id as auction_id,
  a.status,
  a.start_time,
  a.end_time,
  a.current_highest_bid,
  a.total_bids_count,
  cs.id as call_slot_id,
  cs.title,
  cs.description,
  cs.scheduled_start_time,
  cs.duration_minutes,
  cs.starting_price,
  cs.thumbnail_url,
  u.id as influencer_id,
  u.display_name as influencer_name,
  u.profile_image_url as influencer_image,
  u.average_rating
FROM auctions a
JOIN call_slots cs ON a.call_slot_id = cs.id
JOIN users u ON cs.user_id = u.id
WHERE a.status IN ('scheduled', 'active')
  AND cs.is_published = TRUE
  AND u.is_influencer = TRUE
ORDER BY a.end_time ASC;

-- ============================================
-- 2. call_logs テーブルの確認と作成
-- ============================================

-- call_logs テーブルが存在するか確認し、存在しない場合は作成
DO $$
BEGIN
    -- テーブルが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs' AND table_schema = 'public') THEN
        CREATE TABLE call_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            call_slot_id UUID REFERENCES call_slots(id) ON DELETE SET NULL,
            action VARCHAR(50) NOT NULL, -- 'started', 'ended', 'cancelled', 'no_show'
            details JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- インデックス作成
        CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
        CREATE INDEX idx_call_logs_call_slot_id ON call_logs(call_slot_id);
        CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);
        
        RAISE NOTICE 'call_logs テーブルを作成しました';
    ELSE
        -- テーブルが存在する場合、user_idカラムが存在するか確認
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'user_id' AND table_schema = 'public') THEN
            -- user_idカラムを追加
            ALTER TABLE call_logs ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
            CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
            RAISE NOTICE 'call_logs テーブルにuser_idカラムを追加しました';
        ELSE
            RAISE NOTICE 'call_logs テーブルは既に存在し、user_idカラムも存在します';
        END IF;
    END IF;
END $$;

-- ============================================
-- 3. call_logs テーブルの RLS 有効化
-- ============================================

-- RLS を有効化
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. call_logs テーブルの RLS ポリシー作成
-- ============================================

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can insert their own call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can update their own call logs" ON call_logs;
DROP POLICY IF EXISTS "Users can delete their own call logs" ON call_logs;

-- ユーザーは自分の通話ログのみ閲覧可能
CREATE POLICY "Users can view their own call logs" 
  ON call_logs FOR SELECT 
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ユーザーは自分の通話ログのみ挿入可能
CREATE POLICY "Users can insert their own call logs" 
  ON call_logs FOR INSERT 
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ユーザーは自分の通話ログのみ更新可能
CREATE POLICY "Users can update their own call logs" 
  ON call_logs FOR UPDATE 
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ユーザーは自分の通話ログのみ削除可能
CREATE POLICY "Users can delete their own call logs" 
  ON call_logs FOR DELETE 
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- 5. 関連テーブルのRLSポリシー確認と追加
-- ============================================

-- auctions テーブルのRLS確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auctions' AND policyname = 'Everyone can view active auctions') THEN
        -- 全ユーザーがアクティブなオークションを閲覧可能
        CREATE POLICY "Everyone can view active auctions" 
          ON auctions FOR SELECT 
          USING (status IN ('scheduled', 'active'));
        
        RAISE NOTICE 'auctions テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- call_slots テーブルのRLS確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'call_slots' AND policyname = 'Everyone can view published call slots') THEN
        -- 全ユーザーが公開されたTalk枠を閲覧可能
        CREATE POLICY "Everyone can view published call slots" 
          ON call_slots FOR SELECT 
          USING (is_published = TRUE);
        
        RAISE NOTICE 'call_slots テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- users テーブルのRLS確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Everyone can view influencer profiles') THEN
        -- 全ユーザーがインフルエンサーのプロフィールを閲覧可能
        CREATE POLICY "Everyone can view influencer profiles" 
          ON users FOR SELECT 
          USING (is_influencer = TRUE);
        
        RAISE NOTICE 'users テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- ============================================
-- 6. 確認クエリ
-- ============================================

-- RLS が有効になっているか確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('call_logs', 'auctions', 'call_slots', 'users') 
  AND schemaname = 'public'
ORDER BY tablename;

-- 各テーブルのポリシー確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('call_logs', 'auctions', 'call_slots', 'users')
  AND schemaname = 'public'
ORDER BY tablename, cmd;

-- active_auctions_view の設定確認
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'active_auctions_view' AND schemaname = 'public';

-- ============================================
-- 7. 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Supabaseセキュリティエラーの修正が完了しました';
    RAISE NOTICE '============================================';
    RAISE NOTICE '1. active_auctions_view を SECURITY INVOKER で再作成';
    RAISE NOTICE '2. call_logs テーブルの RLS を有効化';
    RAISE NOTICE '3. call_logs テーブルに適切な RLS ポリシーを設定';
    RAISE NOTICE '4. 関連テーブル（auctions, call_slots, users）のRLSポリシーを確認・追加';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'これで Supabase のセキュリティエラーが解決されました';
    RAISE NOTICE '============================================';
END $$;
