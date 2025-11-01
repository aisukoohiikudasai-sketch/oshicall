-- ============================================
-- 未認証ユーザーのアクセス許可修正
-- ============================================
-- ログイン未の状態でもTalk枠情報を見れるようにします
-- ============================================

-- ============================================
-- 1. 現在のRLSポリシーを確認
-- ============================================

-- 各テーブルのRLSポリシーを確認
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
WHERE tablename IN ('auctions', 'call_slots', 'users', 'active_auctions_view')
  AND schemaname = 'public'
ORDER BY tablename, cmd;

-- ============================================
-- 2. 既存のポリシーを削除（必要に応じて）
-- ============================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Everyone can view active auctions" ON auctions;
DROP POLICY IF EXISTS "Everyone can view published call slots" ON call_slots;
DROP POLICY IF EXISTS "Everyone can view influencer profiles" ON users;

-- ============================================
-- 3. 未認証ユーザーも含む適切なポリシーを作成
-- ============================================

-- auctions テーブル: 全ユーザー（認証済み・未認証）がアクティブなオークションを閲覧可能
CREATE POLICY "Anyone can view active auctions" 
  ON auctions FOR SELECT 
  USING (status IN ('scheduled', 'active'));

-- call_slots テーブル: 全ユーザー（認証済み・未認証）が公開されたTalk枠を閲覧可能
CREATE POLICY "Anyone can view published call slots" 
  ON call_slots FOR SELECT 
  USING (is_published = TRUE);

-- users テーブル: 全ユーザー（認証済み・未認証）がインフルエンサープロフィールを閲覧可能
CREATE POLICY "Anyone can view influencer profiles" 
  ON users FOR SELECT 
  USING (is_influencer = TRUE);

-- ============================================
-- 4. active_auctions_view の権限を修正
-- ============================================

-- ビューの権限を再設定
REVOKE ALL ON public.active_auctions_view FROM PUBLIC;
REVOKE ALL ON public.active_auctions_view FROM anon;
REVOKE ALL ON public.active_auctions_view FROM authenticated;

-- 全ユーザー（認証済み・未認証）にSELECT権限を付与
GRANT SELECT ON public.active_auctions_view TO PUBLIC;
GRANT SELECT ON public.active_auctions_view TO anon;
GRANT SELECT ON public.active_auctions_view TO authenticated;

-- ============================================
-- 5. その他の必要なテーブルのポリシーを確認・追加
-- ============================================

-- bids テーブルのポリシー（入札情報は認証済みユーザーのみ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bids' AND policyname = 'Authenticated users can view bids') THEN
        CREATE POLICY "Authenticated users can view bids" 
          ON bids FOR SELECT 
          USING (auth.role() = 'authenticated');
        
        RAISE NOTICE 'bids テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- purchased_slots テーブルのポリシー（購入情報は認証済みユーザーのみ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchased_slots' AND policyname = 'Users can view their own purchases') THEN
        CREATE POLICY "Users can view their own purchases" 
          ON purchased_slots FOR SELECT 
          USING (
            fan_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
            OR influencer_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
          );
        
        RAISE NOTICE 'purchased_slots テーブルにRLSポリシーを追加しました';
    END IF;
END $$;

-- reviews テーブルのポリシー（レビューは認証済みユーザーのみ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can view public reviews') THEN
        CREATE POLICY "Anyone can view public reviews" 
          ON reviews FOR SELECT 
          USING (is_public = TRUE);
        
        RAISE NOTICE 'reviews テーブルにRLSポリシーを追加しました';
    END IF;
    
    -- ユーザーが自分のレビューを閲覧可能
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can view their own reviews') THEN
        CREATE POLICY "Users can view their own reviews" 
          ON reviews FOR SELECT 
          USING (
            fan_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
            OR influencer_user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
          );
        
        RAISE NOTICE 'reviews テーブルにユーザー固有のRLSポリシーを追加しました';
    END IF;
END $$;

-- ============================================
-- 6. 確認クエリ
-- ============================================

-- 各テーブルのRLS有効化確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('auctions', 'call_slots', 'users', 'bids', 'purchased_slots', 'reviews') 
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
WHERE tablename IN ('auctions', 'call_slots', 'users', 'bids', 'purchased_slots', 'reviews')
  AND schemaname = 'public'
ORDER BY tablename, cmd;

-- active_auctions_view の権限確認
SELECT 
  grantee,
  privilege_type,
  is_grantable,
  grantor
FROM information_schema.table_privileges 
WHERE table_name = 'active_auctions_view' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ============================================
-- 7. テスト用の確認クエリ
-- ============================================

-- 未認証ユーザーとしてアクティブなオークションを確認
-- （実際のテストでは、未認証状態でクライアントからアクセス）
SELECT 
  'Testing anonymous access to active_auctions_view' as test_description,
  COUNT(*) as auction_count
FROM active_auctions_view;

-- 未認証ユーザーとして公開されたTalk枠を確認
SELECT 
  'Testing anonymous access to call_slots' as test_description,
  COUNT(*) as call_slot_count
FROM call_slots 
WHERE is_published = TRUE;

-- 未認証ユーザーとしてインフルエンサープロフィールを確認
SELECT 
  'Testing anonymous access to influencer profiles' as test_description,
  COUNT(*) as influencer_count
FROM users 
WHERE is_influencer = TRUE;

-- ============================================
-- 8. 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '未認証ユーザーのアクセス許可修正が完了しました';
    RAISE NOTICE '============================================';
    RAISE NOTICE '1. auctions テーブル: 全ユーザーがアクティブなオークションを閲覧可能';
    RAISE NOTICE '2. call_slots テーブル: 全ユーザーが公開されたTalk枠を閲覧可能';
    RAISE NOTICE '3. users テーブル: 全ユーザーがインフルエンサープロフィールを閲覧可能';
    RAISE NOTICE '4. active_auctions_view: 全ユーザーがアクセス可能';
    RAISE NOTICE '5. その他のテーブル: 適切な認証制御を維持';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'これで未認証ユーザーでもTalk枠情報を見ることができます';
    RAISE NOTICE '============================================';
END $$;
