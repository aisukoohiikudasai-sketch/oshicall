// Supabase Edge Function: オークション終了処理
// Cron: 毎分実行
// Deno.serve()を使用
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

// === メールテンプレート（インライン） ===

interface AuctionWinEmailData {
  winnerName: string;
  talkTitle: string;
  talkDate: string;
  talkTime: string;
  talkDuration: number;
  finalPrice: number;
  influencerName: string;
  influencerImage?: string;
  appUrl: string;
}

function generateAuctionWinEmail(data: AuctionWinEmailData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>オークション落札のお知らせ</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 落札おめでとうございます！</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                \${data.winnerName} 様
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                おめでとうございます！オークションで見事落札されました。<br>
                以下のTalk枠が確保されました。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #831843; font-size: 20px; font-weight: bold;">
                      📅 \${data.talkTitle}
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">インフルエンサー:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">\${data.influencerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">日時:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">\${data.talkDate} \${data.talkTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">通話時間:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">\${data.talkDuration}分</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #581c87; font-size: 16px; font-weight: bold;">落札価格:</td>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #581c87; font-size: 20px; font-weight: bold; text-align: right;">¥\${data.finalPrice.toLocaleString()}</td>
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
                    <a href="\${data.appUrl}/purchased-talks" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
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
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© \${new Date().getFullYear()} OshiTalk. All rights reserved.</p>
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
🎉 落札おめでとうございます！

\${data.winnerName} 様

おめでとうございます！オークションで見事落札されました。
以下のTalk枠が確保されました。

━━━━━━━━━━━━━━━━━━━━━━
📅 \${data.talkTitle}

インフルエンサー: \${data.influencerName}
日時: \${data.talkDate} \${data.talkTime}
通話時間: \${data.talkDuration}分
落札価格: ¥\${data.finalPrice.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━

📝 次のステップ:
1. 決済が正常に完了しました
2. マイページから予約済みTalk枠を確認できます
3. 開始時刻の15分前から通話ルームに入室できます
4. 時間になったらアプリから通話を開始してください

予約済みTalk枠を確認: \${data.appUrl}/purchased-talks

素敵なTalk体験をお楽しみください！
ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
このメールは OshiTalk から自動送信されています
© \${new Date().getFullYear()} OshiTalk. All rights reserved.
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

interface AuctionToFinalize {
  id: string;
  call_slot_id: string;
  end_time: string;
  current_highest_bid: number;
  current_winner_id: string;
  status: string;
  call_slots: {
    user_id: string;
  };
}

Deno.serve(async (req) => {
  try {
    console.log('🔵 オークション終了処理開始');

    // 1. 終了したオークションを取得
    const now = new Date().toISOString();
    const { data: endedAuctions, error: auctionsError } = await supabase
      .from('auctions')
      .select(`
        id,
        call_slot_id,
        end_time,
        current_highest_bid,
        current_winner_id,
        status,
        call_slots!inner(user_id)
      `)
      .eq('status', 'active')
      .lte('end_time', now);

    if (auctionsError) {
      throw auctionsError;
    }

    if (!endedAuctions || endedAuctions.length === 0) {
      console.log('✅ 終了したオークションはありません');
      return new Response(JSON.stringify({ message: '終了したオークションはありません' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔵 ${endedAuctions.length}件のオークションを処理します`);

    const results = [];

    for (const auction of endedAuctions) {
      try {
        const auctionId = auction.id;
        const influencerUserId = auction.call_slots.user_id;

        console.log(`🔵 オークション処理: ${auctionId}`);

        // 2. 最高入札を取得
        const { data: highestBid, error: bidError } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', auctionId)
          .order('bid_amount', { ascending: false })
          .limit(1)
          .single();

        if (bidError || !highestBid) {
          console.log(`⚠️ 入札なし: ${auctionId}`);
          // オークションを終了状態に更新
          await supabase
            .from('auctions')
            .update({ status: 'ended' })
            .eq('id', auctionId);

          results.push({ auction_id: auctionId, status: 'no_bids' });
          continue;
        }

        console.log(`🔵 最高入札: ¥${highestBid.bid_amount} by ${highestBid.user_id}`);

        // 3. 落札者の与信を決済確定（capture）
        if (highestBid.stripe_payment_intent_id) {
          try {
            console.log(`🔵 Payment Intent Capture: ${highestBid.stripe_payment_intent_id}`);
            const capturedPayment = await stripe.paymentIntents.capture(
              highestBid.stripe_payment_intent_id
            );
            console.log(`✅ 決済確定成功: ¥${capturedPayment.amount}`);

            // 4. プラットフォーム手数料計算（20%）
            const platformFee = Math.round(highestBid.bid_amount * 0.2);
            const influencerPayout = highestBid.bid_amount - platformFee;

            // 5. purchased_slotsテーブルに記録
            const { data: purchasedSlot, error: purchaseError } = await supabase
              .from('purchased_slots')
              .insert({
                call_slot_id: auction.call_slot_id,
                fan_user_id: highestBid.user_id,
                influencer_user_id: influencerUserId,
                auction_id: auctionId,
                purchased_price: highestBid.bid_amount,
                platform_fee: platformFee,
                influencer_payout: influencerPayout,
              })
              .select()
              .single();

            if (purchaseError) {
              throw purchaseError;
            }

            console.log(`✅ purchased_slots記録成功: ${purchasedSlot.id}`);

            // 6. payment_transactionsテーブルに記録
            const chargeId = capturedPayment.latest_charge 
              ? (typeof capturedPayment.latest_charge === 'string' 
                  ? capturedPayment.latest_charge 
                  : capturedPayment.latest_charge.id)
              : null;

            await supabase.from('payment_transactions').insert({
              purchased_slot_id: purchasedSlot.id,
              stripe_payment_intent_id: capturedPayment.id,
              stripe_charge_id: chargeId,
              amount: highestBid.bid_amount,
              platform_fee: platformFee,
              influencer_payout: influencerPayout,
              status: 'captured',
            });

            console.log(`✅ payment_transactions記録成功`);

            // 7. 落札者にメール通知を送信
            try {
              // ユーザー情報を取得（auth_user_id経由でemailを取得）
              const { data: winnerUserData, error: userError } = await supabase
                .from('users')
                .select('id, display_name, auth_user_id')
                .eq('id', highestBid.user_id)
                .single();

              // Call Slot情報を取得
              const { data: callSlot, error: slotError } = await supabase
                .from('call_slots')
                .select('title, scheduled_start_time, duration_minutes')
                .eq('id', auction.call_slot_id)
                .single();

              // インフルエンサー情報を取得
              const { data: influencer, error: influencerError } = await supabase
                .from('users')
                .select('display_name, profile_image_url')
                .eq('id', influencerUserId)
                .single();

              // auth.usersからemailを取得
              let winnerEmail = null;
              if (!userError && winnerUserData?.auth_user_id) {
                const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(winnerUserData.auth_user_id);
                if (!authError && authUser?.user?.email) {
                  winnerEmail = authUser.user.email;
                }
              }

              if (!userError && winnerUserData && winnerEmail && !slotError && callSlot && !influencerError && influencer) {
                console.log(`📧 メール送信開始: ${winnerEmail}`);

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
                  finalPrice: highestBid.bid_amount,
                  influencerName: influencer.display_name || 'インフルエンサー',
                  influencerImage: influencer.profile_image_url,
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
                    subject: `🎉 落札おめでとうございます！${callSlot.title}`,
                    html: generateAuctionWinEmail(emailData),
                    text: generateAuctionWinEmailPlainText(emailData),
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error(`❌ メール送信エラー:`, errorData);
                } else {
                  const emailResult = await response.json();
                  console.log(`✅ メール送信成功: ${emailResult.id}`);
                }
              } else {
                console.warn(`⚠️ メール送信スキップ: ユーザー情報が不完全`, {
                  userError,
                  slotError,
                  influencerError,
                });
              }
            } catch (emailError: any) {
              console.error(`❌ メール処理エラー: ${emailError.message}`);
              // メールエラーでも処理は継続
            }

            // 8. オークションを終了状態に更新
            await supabase
              .from('auctions')
              .update({ status: 'ended', current_winner_id: highestBid.user_id })
              .eq('id', auctionId);

            // 9. 他の入札者の与信をキャンセル
            const { data: otherBids } = await supabase
              .from('bids')
              .select('stripe_payment_intent_id, user_id')
              .eq('auction_id', auctionId)
              .neq('user_id', highestBid.user_id);

            if (otherBids && otherBids.length > 0) {
              console.log(`🔵 他の入札者の与信をキャンセル: ${otherBids.length}件`);
              for (const bid of otherBids) {
                if (bid.stripe_payment_intent_id) {
                  try {
                    await stripe.paymentIntents.cancel(bid.stripe_payment_intent_id);
                    console.log(`✅ 与信キャンセル: ${bid.stripe_payment_intent_id}`);
                  } catch (cancelError) {
                    console.warn(`⚠️ 与信キャンセル失敗（継続）: ${cancelError}`);
                  }
                }
              }
            }

            // 10. ユーザー統計を更新
            await supabase.rpc('update_user_statistics', {
              p_fan_id: highestBid.user_id,
              p_influencer_id: influencerUserId,
              p_amount: highestBid.bid_amount,
            });

            results.push({
              auction_id: auctionId,
              status: 'success',
              winner_id: highestBid.user_id,
              amount: highestBid.bid_amount,
            });

            console.log(`✅ オークション終了処理完了: ${auctionId}`);

          } catch (captureError: any) {
            console.error(`❌ 決済確定エラー: ${captureError.message}`);

            // 既にキャプチャ済みの場合は、オークションを終了状態に更新
            if (captureError.message && captureError.message.includes('already been captured')) {
              console.log(`⚠️ 既にキャプチャ済み: ${auctionId} - オークションを終了状態に更新`);

              await supabase
                .from('auctions')
                .update({ status: 'ended', current_winner_id: highestBid.user_id })
                .eq('id', auctionId);

              results.push({
                auction_id: auctionId,
                status: 'already_captured',
                winner_id: highestBid.user_id,
              });
            } else {
              results.push({
                auction_id: auctionId,
                status: 'capture_failed',
                error: captureError.message,
              });
            }
          }
        }
      } catch (error: any) {
        console.error(`❌ オークション処理エラー: ${error.message}`);
        results.push({
          auction_id: auction.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    console.log('✅ 全オークション処理完了');

    return new Response(JSON.stringify({ 
      processed: endedAuctions.length,
      results,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ エラー:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

