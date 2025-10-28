// メールテンプレート

export interface AuctionWinEmailData {
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

export function generateAuctionWinEmail(data: AuctionWinEmailData): string {
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

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 落札おめでとうございます！</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${data.winnerName} 様
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                おめでとうございます！オークションで見事落札されました。<br>
                以下のTalk枠が確保されました。
              </p>

              <!-- Talk Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #831843; font-size: 20px; font-weight: bold;">
                      📅 ${data.talkTitle}
                    </h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">
                          インフルエンサー:
                        </td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">
                          ${data.influencerName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">
                          日時:
                        </td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">
                          ${data.talkDate} ${data.talkTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">
                          通話時間:
                        </td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">
                          ${data.talkDuration}分
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #581c87; font-size: 16px; font-weight: bold;">
                          落札価格:
                        </td>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #581c87; font-size: 20px; font-weight: bold; text-align: right;">
                          ¥${data.finalPrice.toLocaleString()}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: bold;">
                  📝 次のステップ
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                  <li>決済が正常に完了しました</li>
                  <li>マイページから予約済みTalk枠を確認できます</li>
                  <li>開始時刻の15分前から通話ルームに入室できます</li>
                  <li>時間になったらアプリから通話を開始してください</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.appUrl}/purchased-talks" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
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

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                このメールは OshiCall から自動送信されています
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} OshiCall. All rights reserved.
              </p>
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

export interface NewTalkSlotEmailData {
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

export function generateNewTalkSlotEmail(data: NewTalkSlotEmailData): string {
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

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✨ 新しいTalk枠が公開されました！</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${data.followerName} 様
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                フォロー中の <strong>${data.influencerName}</strong> さんが新しいTalk枠を公開しました！<br>
                今すぐオークションに参加してみましょう。
              </p>

              <!-- Talk Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fce7f3 0%, #e9d5ff 100%); border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #831843; font-size: 20px; font-weight: bold;">
                      🎤 ${data.talkTitle}
                    </h2>

                    ${data.talkDescription ? `
                    <p style="margin: 0 0 16px; color: #831843; font-size: 14px; line-height: 1.6;">
                      ${data.talkDescription}
                    </p>
                    ` : ''}

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">
                          日時:
                        </td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">
                          ${data.talkDate} ${data.talkTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">
                          通話時間:
                        </td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">
                          ${data.talkDuration}分
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; font-weight: 500;">
                          開始価格:
                        </td>
                        <td style="padding: 8px 0; color: #831843; font-size: 14px; text-align: right;">
                          ¥${data.startingPrice.toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #c2410c; font-size: 14px; font-weight: bold;">
                          オークション締切:
                        </td>
                        <td style="padding: 8px 0; border-top: 2px solid #f3e8ff; color: #c2410c; font-size: 14px; font-weight: bold; text-align: right;">
                          ${data.auctionEndDate} ${data.auctionEndTime}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Urgency Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                  ⏰ 人気のTalk枠はすぐに埋まってしまいます。お早めにご参加ください！
                </p>
              </div>

              <!-- CTA Button -->
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

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                このメールは OshiCall から自動送信されています
              </p>
              <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">
                フォロー設定を変更したい場合は、マイページから設定できます
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} OshiCall. All rights reserved.
              </p>
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

export function generateNewTalkSlotEmailPlainText(data: NewTalkSlotEmailData): string {
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

export function generateAuctionWinEmailPlainText(data: AuctionWinEmailData): string {
  return `
🎉 落札おめでとうございます！

${data.winnerName} 様

おめでとうございます！オークションで見事落札されました。
以下のTalk枠が確保されました。

━━━━━━━━━━━━━━━━━━━━━━
📅 ${data.talkTitle}

インフルエンサー: ${data.influencerName}
日時: ${data.talkDate} ${data.talkTime}
通話時間: ${data.talkDuration}分
落札価格: ¥${data.finalPrice.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━

📝 次のステップ:
1. 決済が正常に完了しました
2. マイページから予約済みTalk枠を確認できます
3. 開始時刻の15分前から通話ルームに入室できます
4. 時間になったらアプリから通話を開始してください

予約済みTalk枠を確認: ${data.appUrl}/purchased-talks

素敵なTalk体験をお楽しみください！
ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━
このメールは OshiCall から自動送信されています
© ${new Date().getFullYear()} OshiCall. All rights reserved.
  `.trim();
}
