// Supabase Edge Function: 即決購入時のオークション終了処理
// 即決購入が発生した際に即座にオークションを終了させる
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

// === メールテンプレート ===

interface AuctionWinEmailData {
  winnerName: string;
  talkTitle: string;
  talkDate: string;
  talkTime: string;
  talkDuration: number;
  finalPrice: number;
  influencerName: string;
  influencerImage?: string;
  talkThumbnail?: string;
  appUrl: string;
}

function generateAuctionWinEmail(data: AuctionWinEmailData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>即決購入完了のお知らせ</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✨ 即決購入完了！</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${data.winnerName} 様
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                即決購入が完了しました！<br>
                以下のTalk枠が確保されました。
              </p>
              ${data.talkThumbnail ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <img src="${data.talkThumbnail}" alt="${data.talkTitle}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" />
                  </td>
                </tr>
              </table>
              ` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #831843; font-size: 20px; font-weight: bold;">
                      📅 ${data.talkTitle}
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">インフルエンサー:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">${data.influencerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">日時:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">${data.talkDate} ${data.talkTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">通話時間:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">${data.talkDuration}分</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #581c87; font-size: 16px; font-weight: bold;">購入価格:</td>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #581c87; font-size: 20px; font-weight: bold; text-align: right;">¥${data.finalPrice.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: bold;">📝 次のステップ</h3>
                <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                  <li>決済が正常に完了しました</li>
                  <li>マイページから予約済みTalk枠を確認できます</li>
                  <li>開始時刻の15分前から通話ルームに入室できます</li>
                  <li>時間になったらアプリから通話を開始してください</li>
                </ol>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.appUrl}/mypage?tab=collection" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      予約済みTalk枠を確認
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                素敵なTalk体験をお楽しみください！<br>
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">このメールは OshiTalk から自動送信されています</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} OshiTalk. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateAuctionWinEmailPlainText(data: AuctionWinEmailData): string {
  return `
✨ 即決購入完了！

${data.winnerName} 様

即決購入が完了しました！
以下のTalk枠が確保されました。

━━━━━━━━━━━━━━━━━━━━━━
📅 ${data.talkTitle}

インフルエンサー: ${data.influencerName}
日時: ${data.talkDate} ${data.talkTime}
通話時間: ${data.talkDuration}分
購入価格: ¥${data.finalPrice.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━

📝 次のステップ:
1. 決済が正常に完了しました
2. マイページから予約済みTalk枠を確認できます
3. 開始時刻の15分前から通話ルームに入室できます
4. 時間になったらアプリから通話を開始してください

予約済みTalk枠を確認: ${data.appUrl}/mypage?tab=collection

素敵なTalk体験をお楽しみください！
ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
このメールは OshiTalk から自動送信されています
© ${new Date().getFullYear()} OshiTalk. All rights reserved.
  `.trim();
}

// === インフルエンサー向けメールテンプレート ===

interface InfluencerNotificationEmailData {
  influencerName: string;
  talkTitle: string;
  talkDate: string;
  talkTime: string;
  talkDuration: number;
  winnerName: string;
  totalAmount: number;
  platformFee: number;
  influencerPayout: number;
  appUrl: string;
}

function generateInfluencerNotificationEmail(data: InfluencerNotificationEmailData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talk枠が落札されました</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">💰 Talk枠が売れました！</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${data.influencerName} 様
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                あなたのTalk枠が落札されました！<br>
                ファンとの素敵な時間をお楽しみください。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #065f46; font-size: 20px; font-weight: bold;">
                      📅 ${data.talkTitle}
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 500;">落札者:</td>
                        <td style="padding: 8px 0; color: #065f46; font-size: 14px; text-align: right;">${data.winnerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 500;">日時:</td>
                        <td style="padding: 8px 0; color: #065f46; font-size: 14px; text-align: right;">${data.talkDate} ${data.talkTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 500;">通話時間:</td>
                        <td style="padding: 8px 0; color: #065f46; font-size: 14px; text-align: right;">${data.talkDuration}分</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px; color: #92400e; font-size: 18px; font-weight: bold;">💵 収益内訳</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px; font-weight: 500;">落札金額:</td>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px; text-align: right;">¥${data.totalAmount.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px; font-weight: 500;">プラットフォーム手数料 (20%):</td>
                        <td style="padding: 8px 0; color: #92400e; font-size: 14px; text-align: right;">- ¥${data.platformFee.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #fbbf24; color: #78350f; font-size: 16px; font-weight: bold;">あなたの収入:</td>
                        <td style="padding: 8px 0; border-top: 2px solid #fbbf24; color: #78350f; font-size: 20px; font-weight: bold; text-align: right;">¥${data.influencerPayout.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: bold;">📝 次のステップ</h3>
                <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                  <li>マイページから予定されているTalk枠を確認</li>
                  <li>開始時刻の15分前から通話ルームに入室可能</li>
                  <li>時間になったらファンとのTalkを開始してください</li>
                  <li>収益は自動的にアカウントに反映されます</li>
                </ol>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.appUrl}/mypage" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      マイページを確認
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ファンとの素敵な時間をお過ごしください！<br>
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">このメールは OshiTalk から自動送信されています</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} OshiTalk. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateInfluencerNotificationEmailPlainText(data: InfluencerNotificationEmailData): string {
  return `
💰 Talk枠が売れました！

${data.influencerName} 様

あなたのTalk枠が落札されました！
ファンとの素敵な時間をお楽しみください。

━━━━━━━━━━━━━━━━━━━━━━
📅 ${data.talkTitle}

落札者: ${data.winnerName}
日時: ${data.talkDate} ${data.talkTime}
通話時間: ${data.talkDuration}分
━━━━━━━━━━━━━━━━━━━━━━

💵 収益内訳
━━━━━━━━━━━━━━━━━━━━━━
落札金額: ¥${data.totalAmount.toLocaleString()}
プラットフォーム手数料 (20%): - ¥${data.platformFee.toLocaleString()}
────────────────────────
あなたの収入: ¥${data.influencerPayout.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━

📝 次のステップ:
1. マイページから予定されているTalk枠を確認
2. 開始時刻の15分前から通話ルームに入室可能
3. 時間になったらファンとのTalkを開始してください
4. 収益は自動的にアカウントに反映されます

マイページを確認: ${data.appUrl}/mypage

ファンとの素敵な時間をお過ごしください！
ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
このメールは OshiTalk から自動送信されています
© ${new Date().getFullYear()} OshiTalk. All rights reserved.
  `.trim();
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia' as any,
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
const appUrl = Deno.env.get('APP_URL') || 'https://oshicall-2936440db16b.herokuapp.com';
const fromEmail = Deno.env.get('FROM_EMAIL') || 'OshiTalk <info@oshi-talk.com>';

Deno.serve(async (req) => {
  try {
    const { auctionId, winnerId } = await req.json();

    console.log('🔵 即決購入オークション終了処理開始:', { auctionId, winnerId });

    // 1. オークション情報を取得
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('id, status, current_winner_id')
      .eq('id', auctionId)
      .single();

    if (auctionError || !auction) {
      throw new Error('オークションが見つかりません');
    }

    if (auction.status === 'ended') {
      console.log('⚠️ オークションは既に終了しています');
      return new Response(JSON.stringify({ message: '既に終了しています' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. オークションステータスを終了に更新
    console.log('🔵 オークションステータスを終了に更新:', { auctionId, winnerId });
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', auctionId);

    if (updateError) {
      console.error('❌ オークションステータス更新エラー:', updateError);
      throw updateError;
    }

    console.log('✅ オークションステータスを終了に更新しました');

    // 3. 即決購入者以外の入札を取得してPaymentIntentをキャンセル
    // winnerIdが渡されている場合はそれを使用、なければcurrent_winner_idを使用
    const actualWinnerId = winnerId || auction.current_winner_id;

    if (!actualWinnerId) {
      console.warn('⚠️ 落札者IDが特定できません');
    }

    const { data: otherBids } = await supabase
      .from('bids')
      .select('stripe_payment_intent_id, user_id')
      .eq('auction_id', auctionId)
      .neq('user_id', actualWinnerId || '');

    if (otherBids && otherBids.length > 0) {
      console.log(`🔵 ${otherBids.length}件の他の入札をキャンセルします`);

      for (const bid of otherBids) {
        if (bid.stripe_payment_intent_id) {
          try {
            await stripe.paymentIntents.cancel(bid.stripe_payment_intent_id);
            console.log(`✅ PaymentIntentキャンセル成功: ${bid.stripe_payment_intent_id}`);
          } catch (err: any) {
            // already_canceled等のエラーは無視
            if (err.code !== 'payment_intent_unexpected_state') {
              console.error(`⚠️ PaymentIntentキャンセルエラー:`, err.message);
            }
          }
        }
      }
    }

    // 4. 落札者にメールを送信
    if (actualWinnerId) {
      try {
        console.log('📧 落札者へのメール送信処理開始');

        // オークション情報を取得（call_slot_id を含む）
        const { data: auctionWithSlot, error: auctionSlotError } = await supabase
          .from('auctions')
          .select('call_slot_id, current_highest_bid')
          .eq('id', auctionId)
          .single();

        if (auctionSlotError || !auctionWithSlot) {
          console.warn('⚠️ オークション情報取得失敗');
          throw auctionSlotError;
        }

        // 落札者のユーザー情報を取得
        const { data: winnerUserData, error: userError } = await supabase
          .from('users')
          .select('display_name, auth_user_id')
          .eq('id', actualWinnerId)
          .single();

        // Call slot情報を取得
        const { data: callSlot, error: slotError } = await supabase
          .from('call_slots')
          .select('title, scheduled_start_time, duration_minutes, user_id, thumbnail_url')
          .eq('id', auctionWithSlot.call_slot_id)
          .single();

        // インフルエンサー情報を取得
        const { data: influencerUserData, error: influencerError } = await supabase
          .from('users')
          .select('display_name, profile_image_url, auth_user_id')
          .eq('id', callSlot?.user_id)
          .single();

        // auth.usersからemailを取得
        let winnerEmail = null;
        if (!userError && winnerUserData?.auth_user_id) {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(winnerUserData.auth_user_id);
          if (!authError && authUser?.user?.email) {
            winnerEmail = authUser.user.email;
          }
        }

        // 落札者へのメール送信
        if (!userError && winnerUserData && winnerEmail && !slotError && callSlot && !influencerError && influencerUserData) {
          console.log(`📧 落札者メール送信開始: ${winnerEmail}`);

          const scheduledDate = new Date(callSlot.scheduled_start_time);
          const emailData = {
            winnerName: winnerUserData.display_name || 'お客様',
            talkTitle: callSlot.title,
            talkDate: scheduledDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            }),
            talkTime: scheduledDate.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            talkDuration: callSlot.duration_minutes,
            finalPrice: auctionWithSlot.current_highest_bid,
            influencerName: influencerUserData.display_name || 'インフルエンサー',
            influencerImage: influencerUserData.profile_image_url,
            talkThumbnail: callSlot.thumbnail_url,
            appUrl,
          };

          // Resend APIに直接fetchで送信
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: winnerEmail,
              reply_to: 'info@oshi-talk.com',
              subject: `✨ 即決購入完了！${callSlot.title}`,
              html: generateAuctionWinEmail(emailData),
              text: generateAuctionWinEmailPlainText(emailData),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ 落札者メール送信エラー:`, errorData);
          } else {
            const emailResult = await response.json();
            console.log(`✅ 落札者メール送信成功: ${emailResult.id}`);
          }
        } else {
          console.warn(`⚠️ 落札者メール送信スキップ: ユーザー情報が不完全`, {
            userError,
            slotError,
            influencerError,
          });
        }

        // 5. インフルエンサーにメールを送信（落札者のメール送信とは独立）
        if (!slotError && callSlot && !influencerError && influencerUserData) {
          try {
            console.log('📧 インフルエンサーへのメール送信処理開始');
            console.log(`📧 インフルエンサーUserData:`, JSON.stringify(influencerUserData, null, 2));

            const scheduledDate = new Date(callSlot.scheduled_start_time);

            // インフルエンサーのemailを取得
            let influencerEmail = null;
            if (influencerUserData?.auth_user_id) {
              console.log(`📧 インフルエンサーauth_user_id: ${influencerUserData.auth_user_id}`);
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(influencerUserData.auth_user_id);
              if (authError) {
                console.error(`❌ インフルエンサーauth取得エラー:`, authError);
              }
              if (!authError && authUser?.user?.email) {
                influencerEmail = authUser.user.email;
                console.log(`✅ インフルエンサーemail取得成功: ${influencerEmail}`);
              } else {
                console.warn(`⚠️ インフルエンサーemail取得失敗: authUser=${JSON.stringify(authUser)}`);
              }
            } else {
              console.warn(`⚠️ インフルエンサーauth_user_idが存在しません`);
            }

            if (influencerEmail) {
              console.log(`📧 インフルエンサーメール送信開始: ${influencerEmail}`);

              // プラットフォーム手数料を計算（20%）
              const totalAmount = auctionWithSlot.current_highest_bid;
              const platformFee = Math.round(totalAmount * 0.2);
              const influencerPayout = totalAmount - platformFee;

              const influencerEmailData = {
                influencerName: influencerUserData.display_name || 'インフルエンサー様',
                talkTitle: callSlot.title,
                talkDate: scheduledDate.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                }),
                talkTime: scheduledDate.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                talkDuration: callSlot.duration_minutes,
                winnerName: winnerUserData?.display_name || 'ファン',
                totalAmount,
                platformFee,
                influencerPayout,
                appUrl,
              };

              // Resend APIでインフルエンサーにメール送信
              const influencerResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: fromEmail,
                  to: influencerEmail,
                  reply_to: 'info@oshi-talk.com',
                  subject: `💰 Talk枠が売れました！${callSlot.title}`,
                  html: generateInfluencerNotificationEmail(influencerEmailData),
                  text: generateInfluencerNotificationEmailPlainText(influencerEmailData),
                }),
              });

              if (!influencerResponse.ok) {
                const errorData = await influencerResponse.json();
                console.error(`❌ インフルエンサーメール送信エラー:`, errorData);
              } else {
                const emailResult = await influencerResponse.json();
                console.log(`✅ インフルエンサーメール送信成功: ${emailResult.id}`);
              }
            } else {
              console.warn(`⚠️ インフルエンサーメール送信スキップ: emailが取得できませんでした`);
            }
          } catch (influencerEmailError: any) {
            console.error(`❌ インフルエンサーメール処理エラー: ${influencerEmailError.message}`);
            // メールエラーでも処理は継続
          }
        } else {
          console.warn(`⚠️ インフルエンサーメール送信スキップ: 必要な情報が取得できません`, {
            slotError,
            influencerError,
          });
        }
      } catch (emailError: any) {
        console.error(`❌ メール処理エラー: ${emailError.message}`);
        // メールエラーでも処理は継続
      }
    }

    console.log('✅ 即決購入オークション終了処理完了');

    return new Response(
      JSON.stringify({
        message: 'オークションを終了しました',
        auctionId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ 即決購入オークション終了処理エラー:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '処理中にエラーが発生しました',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
