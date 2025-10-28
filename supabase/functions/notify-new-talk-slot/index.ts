// Supabase Edge Function: 新規Talk枠のフォロワー通知（統合版）
// Dashboardから直接デプロイ可能
// Deno.serve()を使用して認証をバイパス

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@3.0.0';

// === メールテンプレート（インライン） ===

interface NewTalkSlotEmailData {
  followerName: string;
  influencerName: string;
  influencerImage?: string;
  talkTitle: string;
  talkDescription?: string;
  talkDate: string;
  talkTime: string;
  talkDuration: number;
  startingPrice: number;
  auctionEndDate: string;
  auctionEndTime: string;
  appUrl: string;
  talkSlotId: string;
}

function generateNewTalkSlotEmail(data: NewTalkSlotEmailData): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>新しいTalk枠のお知らせ</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✨ 新しいTalk枠が公開されました！</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${data.followerName} 様
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                フォロー中の <strong>${data.influencerName}</strong> さんが新しいTalk枠を公開しました！<br>
                今すぐオークションに参加してみましょう。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #831843; font-size: 20px; font-weight: bold;">
                      🎤 ${data.talkTitle}
                    </h2>
                    ${data.talkDescription ? `<p style="margin: 0 0 16px; color: #831843; font-size: 14px; line-height: 1.6;">${data.talkDescription}</p>` : ''}
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">日時:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">${data.talkDate} ${data.talkTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">通話時間:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">${data.talkDuration}分</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">開始価格:</td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">¥${data.startingPrice.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #c2410c; font-size: 14px; font-weight: bold;">オークション締切:</td>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #c2410c; font-size: 14px; font-weight: bold; text-align: right;">${data.auctionEndDate} ${data.auctionEndTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                  ⏰ 人気のTalk枠はすぐに埋まってしまいます。お早めにご参加ください！
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.appUrl}/talk/${data.talkSlotId}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      詳細を見る・入札する
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                このチャンスをお見逃しなく！<br>
                素敵なTalk体験をお楽しみください。
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">このメールは OshiCall から自動送信されています</p>
              <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">フォロー設定を変更したい場合は、マイページから設定できます</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} OshiCall. All rights reserved.</p>
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

function generateNewTalkSlotEmailPlainText(data: NewTalkSlotEmailData): string {
  return `
✨ 新しいTalk枠が公開されました！

${data.followerName} 様

フォロー中の ${data.influencerName} さんが新しいTalk枠を公開しました！
今すぐオークションに参加してみましょう。

━━━━━━━━━━━━━━━━━━━━━━
🎤 ${data.talkTitle}

${data.talkDescription ? data.talkDescription + '\n\n' : ''}日時: ${data.talkDate} ${data.talkTime}
通話時間: ${data.talkDuration}分
開始価格: ¥${data.startingPrice.toLocaleString()}

オークション締切: ${data.auctionEndDate} ${data.auctionEndTime}
━━━━━━━━━━━━━━━━━━━━━━

⏰ 人気のTalk枠はすぐに埋まってしまいます。お早めにご参加ください！

詳細を見る・入札する: ${data.appUrl}/talk/${data.talkSlotId}

このチャンスをお見逃しなく！
素敵なTalk体験をお楽しみください。

━━━━━━━━━━━━━━━━━━━━━━
このメールは OshiCall から自動送信されています
フォロー設定を変更したい場合は、マイページから設定できます
© ${new Date().getFullYear()} OshiCall. All rights reserved.
  `.trim();
}

// === メイン処理 ===

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '');
const appUrl = Deno.env.get('APP_URL') || 'https://oshicall-2936440db16b.herokuapp.com';
const fromEmail = Deno.env.get('FROM_EMAIL') || 'OshiCall <noreply@oshicall.com>';

interface CallSlotPayload {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_start_time: string;
  duration_minutes: number;
  starting_price: number;
  is_published: boolean;
}

Deno.serve(async (req) => {
  // CORSヘッダーとOPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('📧 新規Talk枠通知処理開始');
    console.log('📧 リクエストメソッド:', req.method);
    console.log('📧 リクエストURL:', req.url);

    const payload = await req.json();
    const callSlot: CallSlotPayload = payload.record;

    if (!callSlot.is_published) {
      console.log('⏭️  非公開のため通知スキップ');
      return new Response(JSON.stringify({ message: '非公開のため通知スキップ' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: influencer, error: influencerError } = await supabase
      .from('users')
      .select('display_name, profile_image_url')
      .eq('id', callSlot.user_id)
      .single();

    if (influencerError || !influencer) {
      throw new Error(`インフルエンサー情報取得エラー: ${influencerError?.message}`);
    }

    console.log(`📧 インフルエンサー: ${influencer.display_name}`);

    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select(`
        follower_id,
        users!follows_follower_id_fkey(email, display_name)
      `)
      .eq('following_id', callSlot.user_id);

    if (followersError) {
      throw new Error(`フォロワー取得エラー: ${followersError.message}`);
    }

    if (!followers || followers.length === 0) {
      console.log('⏭️  フォロワーがいないため通知スキップ');
      return new Response(JSON.stringify({ message: 'フォロワーがいないため通知スキップ' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📧 ${followers.length}人のフォロワーに通知送信`);

    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('end_time')
      .eq('call_slot_id', callSlot.id)
      .single();

    if (auctionError) {
      console.warn(`⚠️  オークション情報取得エラー: ${auctionError.message}`);
    }

    const talkDate = new Date(callSlot.scheduled_start_time);
    const auctionEndDate = auction ? new Date(auction.end_time) : new Date(talkDate.getTime() - 24 * 60 * 60 * 1000);

    const emailData = {
      influencerName: influencer.display_name || 'インフルエンサー',
      influencerImage: influencer.profile_image_url,
      talkTitle: callSlot.title,
      talkDescription: callSlot.description || undefined,
      talkDate: talkDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }),
      talkTime: talkDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      talkDuration: callSlot.duration_minutes,
      startingPrice: callSlot.starting_price,
      auctionEndDate: auctionEndDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }),
      auctionEndTime: auctionEndDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      appUrl,
      talkSlotId: callSlot.id,
    };

    const results = [];
    for (const follower of followers) {
      const followerUser = follower.users as any;

      if (!followerUser?.email) {
        console.warn(`⚠️  フォロワー ${follower.follower_id} のメールアドレスが見つかりません`);
        continue;
      }

      try {
        const followerEmailData = {
          ...emailData,
          followerName: followerUser.display_name || 'お客様',
        };

        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: followerUser.email,
          subject: `✨ ${influencer.display_name}さんの新しいTalk枠が公開されました！`,
          html: generateNewTalkSlotEmail(followerEmailData),
          text: generateNewTalkSlotEmailPlainText(followerEmailData),
        });

        if (emailError) {
          console.error(`❌ メール送信エラー (${followerUser.email}):`, emailError);
          results.push({
            email: followerUser.email,
            status: 'error',
            error: emailError.message,
          });
        } else {
          console.log(`✅ メール送信成功 (${followerUser.email}): ${emailResult?.id}`);
          results.push({
            email: followerUser.email,
            status: 'success',
            messageId: emailResult?.id,
          });
        }
      } catch (error: any) {
        console.error(`❌ メール送信エラー (${followerUser.email}):`, error);
        results.push({
          email: followerUser.email,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`✅ 通知処理完了: 成功 ${successCount}件, 失敗 ${errorCount}件`);

    return new Response(JSON.stringify({
      message: `通知処理完了`,
      totalFollowers: followers.length,
      successCount,
      errorCount,
      results,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('❌ エラー:', error);
    console.error('❌ エラースタック:', error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
