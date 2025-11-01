// Daily.co Webhookエンドポイント
import { Router, Request, Response } from 'express';
import { captureTalkPayment } from '../services/paymentCapture';

export const createDailyWebhookRouter = (supabase: any) => {
  const router = Router();

  /**
   * POST /webhook
   * Daily.coからのWebhookを受信してイベントログを保存
   */
  router.post('/webhook', async (req: Request, res: Response) => {
    try {
      const event = req.body;

      console.log('🔵 Daily.co Webhook受信:', {
        type: event.type,
        room: event.room?.name,
        participant: event.participant?.user_id,
        timestamp: event.timestamp
      });

      // roomNameからpurchased_slot_idを特定
      const roomName = event.room?.name;
      if (!roomName) {
        console.warn('⚠️ roomNameが含まれていません');
        return res.status(200).json({ received: true });
      }

      // roomNameは "call-{purchased_slot_id}" の形式
      const purchasedSlotId = roomName.replace('call-', '');

      const { data: purchasedSlot, error: slotError } = await supabase
        .from('purchased_slots')
        .select('id, influencer_user_id, fan_user_id')
        .eq('video_call_room_id', roomName)
        .single();

      if (slotError || !purchasedSlot) {
        console.warn('⚠️ ルームに紐づくpurchased_slotが見つかりません:', roomName);
        return res.status(200).json({ received: true });
      }

      // user_idの特定
      let userId: string | null = null;
      if (event.participant?.user_id) {
        userId = event.participant.user_id;
      }

      // イベントデータの準備
      const eventData: any = {
        purchased_slot_id: purchasedSlot.id,
        event_type: event.type,
        user_id: userId,
        participant_id: event.participant?.participant_id || null,
        event_data: event,
        created_at: event.timestamp || new Date().toISOString()
      };

      // room-endedイベントの場合、終了理由を保存
      if (event.type === 'room.ended' || event.type === 'meeting.ended') {
        // Daily.coの自動終了判定
        // expiredAt が存在する場合は規定時間経過による自動終了
        const reason = event.end_reason ||
                      (event.expired_at ? 'duration' : 'manual');
        eventData.room_end_reason = reason;

        console.log('🔵 ルーム終了イベント:', {
          room: roomName,
          reason,
          expired_at: event.expired_at
        });
      }

      // イベントログを保存
      const { error: insertError } = await supabase
        .from('daily_call_events')
        .insert(eventData);

      if (insertError) {
        console.error('❌ イベント保存エラー:', insertError);
        throw insertError;
      }

      console.log('✅ Daily.coイベント保存成功:', {
        type: event.type,
        purchased_slot_id: purchasedSlot.id
      });

      // room-endedイベントの場合、決済処理をトリガー
      if (event.type === 'room.ended' || event.type === 'meeting.ended') {
        console.log('🔵 決済処理をトリガー:', purchasedSlot.id);

        // 非同期で決済処理を実行（Webhookレスポンスは即座に返す）
        processTalkPayment(supabase, purchasedSlot.id).catch(error => {
          console.error('❌ 決済処理エラー:', error);
        });
      }

      res.status(200).json({ received: true });

    } catch (error: any) {
      console.error('❌ Daily.co Webhook処理エラー:', error);
      // Webhookは常に200を返す（Daily.coの再送を防ぐため）
      res.status(200).json({ received: true, error: error.message });
    }
  });

  return router;
};

/**
 * Talk終了後の決済処理
 * room-endedイベント受信時に非同期で実行
 */
async function processTalkPayment(supabase: any, purchasedSlotId: string) {
  try {
    console.log('🔵 Talk決済処理開始:', purchasedSlotId);

    // purchased_slotとbid情報を取得
    const { data: purchasedSlot, error: slotError } = await supabase
      .from('purchased_slots')
      .select(`
        *,
        call_slots (
          scheduled_start_time,
          duration_minutes
        )
      `)
      .eq('id', purchasedSlotId)
      .single();

    if (slotError || !purchasedSlot) {
      console.error('❌ purchased_slot取得エラー:', slotError);
      return;
    }

    // 既に決済済みかチェック
    const { data: existingPayment } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('purchased_slot_id', purchasedSlotId)
      .single();

    if (existingPayment) {
      console.log('⚠️ 既に決済済み:', purchasedSlotId);
      return;
    }

    // auction_idからbid情報を取得
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', purchasedSlot.auction_id)
      .eq('user_id', purchasedSlot.fan_user_id)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single();

    if (bidError || !bid || !bid.stripe_payment_intent_id) {
      console.error('❌ bid情報取得エラー:', bidError);
      return;
    }

    console.log('🔵 決済判定・実行:', {
      purchased_slot_id: purchasedSlotId,
      payment_intent: bid.stripe_payment_intent_id,
      bid_amount: bid.bid_amount
    });

    // 決済判定と実行
    const result = await captureTalkPayment(
      supabase,
      purchasedSlotId,
      bid.stripe_payment_intent_id,
      bid.bid_amount
    );

    if (result.success) {
      console.log('✅ Talk決済成功:', result.message);

      // ユーザー統計を更新
      await supabase.rpc('update_user_statistics', {
        p_fan_id: purchasedSlot.fan_user_id,
        p_influencer_id: purchasedSlot.influencer_user_id,
        p_amount: bid.bid_amount
      }).catch((err: any) => {
        console.warn('⚠️ ユーザー統計更新エラー（継続）:', err);
      });

    } else {
      console.log('⚠️ Talk決済スキップ:', result.message);
    }

  } catch (error: any) {
    console.error('❌ processTalkPayment エラー:', error);
    // エラーをログに記録するが、処理は続行
  }
}
