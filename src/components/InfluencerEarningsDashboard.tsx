// インフルエンサー売上ダッシュボードコンポーネント
import React, { useEffect, useState } from 'react';
import { getInfluencerEarnings, createStripeDashboardLink } from '../api/stripe';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  recentTransactions: Array<{
    id: string;
    talkTitle: string;
    amount: number;
    platformFee: number;
    grossAmount: number;
    completedAt: string;
    status: string;
  }>;
  monthlyStats: {
    currentMonth: {
      earnings: number;
      callCount: number;
      averagePrice: number;
    };
    previousMonth: {
      earnings: number;
      callCount: number;
    };
  };
  totalCallCount: number;
  balanceError?: string | null;
}

interface Props {
  authUserId: string;
}

export const InfluencerEarningsDashboard: React.FC<Props> = ({ authUserId }) => {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, [authUserId]);

  const loadEarnings = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getInfluencerEarnings(authUserId);
      setEarnings(data);
    } catch (err: any) {
      console.error('売上データ取得エラー:', err);
      setError(err.message || '売上データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      setIsOpeningDashboard(true);
      const { url } = await createStripeDashboardLink(authUserId);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('Dashboard リンク生成エラー:', err);
      alert('詳細画面を開けませんでした。もう一度お試しください。');
    } finally {
      setIsOpeningDashboard(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadEarnings}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">💰 売上サマリー</h2>
        <button
          onClick={handleOpenStripeDashboard}
          disabled={isOpeningDashboard}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOpeningDashboard ? '読み込み中...' : '詳細を見る →'}
        </button>
      </div>

      {/* 残高取得エラー警告 */}
      {earnings.balanceError && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">⚠️ 残高情報が取得できませんでした</span>
            <br />
            <span className="text-xs mt-1 block">
              テストモードのStripe Connectアカウントでは実際の残高は表示されません。
              詳細はStripe Dashboardをご確認ください。
            </span>
          </p>
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* 総売上 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 font-medium mb-1">総売上（受取額）</div>
          <div className="text-3xl font-bold text-green-900">
            {formatCurrency(earnings.totalEarnings)}
          </div>
          <div className="text-xs text-green-600 mt-2">
            {earnings.totalCallCount}件の通話完了
          </div>
        </div>

        {/* 入金予定額 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700 font-medium mb-1">入金予定額</div>
          <div className="text-3xl font-bold text-blue-900">
            {formatCurrency(earnings.pendingBalance)}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            通常7営業日後に入金
          </div>
        </div>

        {/* 入金可能額 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-700 font-medium mb-1">入金可能額</div>
          <div className="text-3xl font-bold text-purple-900">
            {formatCurrency(earnings.availableBalance)}
          </div>
          <div className="text-xs text-purple-600 mt-2">
            即時出金可能
          </div>
        </div>
      </div>

      {/* 今月の売上 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 今月の実績</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">今月の売上</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(earnings.monthlyStats.currentMonth.earnings)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">通話回数</div>
            <div className="text-xl font-bold text-gray-900">
              {earnings.monthlyStats.currentMonth.callCount}回
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">平均単価</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(earnings.monthlyStats.currentMonth.averagePrice)}
            </div>
          </div>
        </div>

        {/* 前月比較 */}
        {earnings.monthlyStats.previousMonth.callCount > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            前月: {formatCurrency(earnings.monthlyStats.previousMonth.earnings)}
            （{earnings.monthlyStats.previousMonth.callCount}回）
            {earnings.monthlyStats.currentMonth.earnings > earnings.monthlyStats.previousMonth.earnings && (
              <span className="text-green-600 ml-2">
                ↑ {formatCurrency(earnings.monthlyStats.currentMonth.earnings - earnings.monthlyStats.previousMonth.earnings)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 直近の取引履歴 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 直近の取引</h3>
        {earnings.recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">まだ取引がありません</p>
        ) : (
          <div className="space-y-3">
            {earnings.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{tx.talkTitle}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(tx.completedAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(tx.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    総額: {formatCurrency(tx.grossAmount)} (手数料: {formatCurrency(tx.platformFee)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ヘルプテキスト */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-2">💡 入金について</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>毎週月曜日に前週の売上が確定します</li>
            <li>確定から7営業日後に銀行口座へ入金されます</li>
            <li>詳細な入金履歴は「詳細を見る」ボタンから確認できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
