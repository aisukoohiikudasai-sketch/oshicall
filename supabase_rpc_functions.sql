-- ユーザー統計更新のRPC関数

-- 既存の関数を削除
DROP FUNCTION IF EXISTS update_user_statistics(UUID, UUID, DECIMAL);

-- ユーザー統計を更新する関数
CREATE OR REPLACE FUNCTION update_user_statistics(
  p_fan_id UUID,
  p_influencer_id UUID,
  p_amount DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ファン（落札者）の統計を更新
  UPDATE users
  SET 
    total_spent = total_spent + p_amount,
    total_calls_purchased = total_calls_purchased + 1,
    updated_at = NOW()
  WHERE id = p_fan_id;
  
  -- インフルエンサーの統計を更新
  UPDATE users
  SET 
    total_earnings = total_earnings + (p_amount * 0.8), -- 80%（手数料20%引き）
    total_calls_completed = total_calls_completed + 1,
    updated_at = NOW()
  WHERE id = p_influencer_id;
  
  RAISE NOTICE '✅ ユーザー統計更新完了: Fan=%, Influencer=%, Amount=%', p_fan_id, p_influencer_id, p_amount;
END;
$$;

-- 実行権限を付与
GRANT EXECUTE ON FUNCTION update_user_statistics(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_statistics(UUID, UUID, DECIMAL) TO service_role;

-- テスト
-- SELECT update_user_statistics('user_id_1', 'user_id_2', 10000);

