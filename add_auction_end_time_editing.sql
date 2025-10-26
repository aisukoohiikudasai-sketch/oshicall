-- オークション終了時間編集機能の追加
-- Talk枠設定時に24時間前のデフォルト設定、編集機能、カウントダウン表示対応

-- 1. auctionsテーブルにauction_end_timeカラムを追加（オークション終了時間を明確に分離）
DO $$
BEGIN
    -- auction_end_timeカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auctions' 
        AND column_name = 'auction_end_time'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE auctions ADD COLUMN auction_end_time TIMESTAMP WITH TIME ZONE;
        
        -- 既存データのauction_end_timeをend_timeと同じ値に設定
        UPDATE auctions SET auction_end_time = end_time WHERE auction_end_time IS NULL;
        
        -- NOT NULL制約を追加
        ALTER TABLE auctions ALTER COLUMN auction_end_time SET NOT NULL;
        
        -- 制約を追加（auction_end_timeはcall_slotsのscheduled_start_timeより前である必要がある）
        ALTER TABLE auctions ADD CONSTRAINT valid_auction_end_time 
        CHECK (auction_end_time < (
            SELECT scheduled_start_time 
            FROM call_slots 
            WHERE call_slots.id = auctions.call_slot_id
        ));
    END IF;
END $$;

-- 2. オークション終了時間を更新するRPC関数を作成
CREATE OR REPLACE FUNCTION update_auction_end_time(
    p_auction_id UUID,
    p_new_end_time TIMESTAMP WITH TIME ZONE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_call_slot_id UUID;
    v_scheduled_start_time TIMESTAMP WITH TIME ZONE;
    v_result JSON;
BEGIN
    -- オークションのcall_slot_idを取得
    SELECT call_slot_id INTO v_call_slot_id
    FROM auctions
    WHERE id = p_auction_id;
    
    IF v_call_slot_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'オークションが見つかりません');
    END IF;
    
    -- 通話枠の開始時間を取得
    SELECT scheduled_start_time INTO v_scheduled_start_time
    FROM call_slots
    WHERE id = v_call_slot_id;
    
    -- オークション終了時間は通話枠開始時間より前である必要がある
    IF p_new_end_time >= v_scheduled_start_time THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'オークション終了時間は通話枠開始時間より前である必要があります'
        );
    END IF;
    
    -- オークション終了時間を更新
    UPDATE auctions 
    SET 
        auction_end_time = p_new_end_time,
        end_time = p_new_end_time, -- 既存のend_timeも更新
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_auction_id;
    
    RETURN json_build_object('success', true, 'message', 'オークション終了時間を更新しました');
END;
$$;

-- 3. オークション終了時間を取得するRPC関数を作成
CREATE OR REPLACE FUNCTION get_auction_end_time(p_auction_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction_end_time TIMESTAMP WITH TIME ZONE;
    v_call_slot_start_time TIMESTAMP WITH TIME ZONE;
    v_result JSON;
BEGIN
    -- オークション終了時間と通話枠開始時間を取得
    SELECT 
        a.auction_end_time,
        cs.scheduled_start_time
    INTO 
        v_auction_end_time,
        v_call_slot_start_time
    FROM auctions a
    JOIN call_slots cs ON a.call_slot_id = cs.id
    WHERE a.id = p_auction_id;
    
    IF v_auction_end_time IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'オークションが見つかりません');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'auction_end_time', v_auction_end_time,
        'call_slot_start_time', v_call_slot_start_time,
        'time_remaining_seconds', EXTRACT(EPOCH FROM (v_auction_end_time - NOW()))::INTEGER
    );
END;
$$;

-- 4. オークション作成時に24時間前のデフォルト設定を行う関数を作成
CREATE OR REPLACE FUNCTION create_auction_with_default_end_time(
    p_call_slot_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_scheduled_start_time TIMESTAMP WITH TIME ZONE;
    v_default_end_time TIMESTAMP WITH TIME ZONE;
    v_auction_id UUID;
BEGIN
    -- 通話枠の開始時間を取得
    SELECT scheduled_start_time INTO v_scheduled_start_time
    FROM call_slots
    WHERE id = p_call_slot_id;
    
    IF v_scheduled_start_time IS NULL THEN
        RETURN json_build_object('success', false, 'error', '通話枠が見つかりません');
    END IF;
    
    -- 24時間前の時間を計算（最低でも1時間前）
    v_default_end_time := v_scheduled_start_time - INTERVAL '24 hours';
    
    -- 現在時刻から1時間後より前の場合は1時間前に設定
    IF v_default_end_time < (NOW() + INTERVAL '1 hour') THEN
        v_default_end_time := NOW() + INTERVAL '1 hour';
    END IF;
    
    -- オークションを作成
    INSERT INTO auctions (
        call_slot_id,
        start_time,
        end_time,
        auction_end_time,
        status,
        current_highest_bid,
        total_bids_count,
        unique_bidders_count
    ) VALUES (
        p_call_slot_id,
        p_start_time,
        v_default_end_time,
        v_default_end_time,
        'scheduled',
        (SELECT starting_price FROM call_slots WHERE id = p_call_slot_id),
        0,
        0
    ) RETURNING id INTO v_auction_id;
    
    RETURN json_build_object(
        'success', true,
        'auction_id', v_auction_id,
        'auction_end_time', v_default_end_time,
        'call_slot_start_time', v_scheduled_start_time
    );
END;
$$;

-- 5. 権限設定
GRANT EXECUTE ON FUNCTION update_auction_end_time(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_auction_end_time(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_auction_with_default_end_time(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- 6. RLSポリシーを追加
-- インフルエンサーは自分のオークションの終了時間を編集できる
CREATE POLICY "Influencers can update their auction end time"
ON auctions FOR UPDATE
USING (
    call_slot_id IN (
        SELECT id FROM call_slots 
        WHERE user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid() AND is_influencer = TRUE
        )
    )
);

-- 7. 確認クエリ
SELECT 
    'auction_end_time column added' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'auctions' 
AND column_name = 'auction_end_time';

-- 8. 完了メッセージ
SELECT 'オークション終了時間編集機能の追加が完了しました' as status;
