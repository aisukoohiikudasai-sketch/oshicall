import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Calendar, 
  Pen as EditIcon, 
  Video, 
  Crown,
  Award,
  Camera,
  Plus,
  X,
  Eye,
  EyeOff,
  Heart,
  Clock,
  DollarSign,
  Users,
  Sparkles,
  Shield,
  Lock,
  Globe,
  Save,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  mockUserProfile, 
  mockBadges, 
  mockActivityLogs, 
  mockCollections
} from '../data/mockData';
import { UserProfile, Badge as BadgeType } from '../types';
import { updateUserProfile, updateProfileImage } from '../api/user';
import { validateImageFile, getImagePreviewUrl } from '../lib/storage';
import { createConnectAccount, getInfluencerStripeStatus } from '../api/stripe';
import { supabase } from '../lib/supabase';
import CreateCallSlotForm from '../components/CreateCallSlotForm';
import { getInfluencerCallSlots, deleteCallSlot, toggleCallSlotPublish } from '../api/callSlots';
import type { CallSlot } from '../lib/supabase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function MyPage() {
  const { user, supabaseUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'rank' | 'badges' | 'activity' | 'collection' | 'privacy'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [newTag, setNewTag] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [activityFilter, setActivityFilter] = useState<'all' | 'call' | 'bid' | 'event'>('all');
  const [activitySort, setActivitySort] = useState<'date' | 'type'>('date');
  
  // インフルエンサーダッシュボード用の状態
  const [callSlots, setCallSlots] = useState<CallSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  
  // 編集用の状態
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Stripe Connect関連の状態
  const [stripeAccountStatus, setStripeAccountStatus] = useState<string>('not_setup');
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // デモモード: ログイン無しでもダミーデータでマイページを表示
  const isDemoMode = !user;

  // 実際のユーザーデータをロード
  useEffect(() => {
    if (supabaseUser) {
      setEditedDisplayName(supabaseUser.display_name);
      setEditedBio(supabaseUser.bio || '');
      setImagePreview(supabaseUser.profile_image_url || '');
      
      // インフルエンサーの場合、Stripe Connect状態を確認
      if (supabaseUser.is_influencer) {
        checkStripeAccountStatus();
        loadCallSlots();
      }
    }
  }, [supabaseUser]);

  // Stripe Connect アカウント状態を確認
  const checkStripeAccountStatus = async () => {
    if (!supabaseUser) return;
    
    console.log('🔍 Stripe状態確認開始:', {
      supabaseUserId: supabaseUser.id,
      authUserId: supabaseUser.auth_user_id,
      isInfluencer: supabaseUser.is_influencer
    });
    
    try {
      // auth_user_idを使用してAPIを呼び出し
      const userId = supabaseUser.auth_user_id || supabaseUser.id;
      console.log('🔍 使用するユーザーID:', userId);
      
      const status = await getInfluencerStripeStatus(userId);
      console.log('✅ Stripe状態取得成功:', status);
      setStripeAccountStatus(status.accountStatus || 'not_setup');
    } catch (error) {
      console.error('Stripe アカウント状態の確認エラー:', error);
      setStripeAccountStatus('not_setup');
    }
  };

  // Stripe Connect アカウント作成
  const handleSetupStripeConnect = async () => {
    if (!supabaseUser) return;
    
    // デバッグ: ユーザー情報をコンソールに出力
    console.log('🔍 ユーザー情報:', {
      id: supabaseUser.id,
      auth_user_id: supabaseUser.auth_user_id,
      display_name: supabaseUser.display_name,
      is_influencer: supabaseUser.is_influencer
    });
    
    // より詳細なデバッグ情報
    console.log('🔍 完全なユーザーオブジェクト:', supabaseUser);
    console.log('🔍 利用可能なプロパティ:', Object.keys(supabaseUser));
    
    // auth_user_id を使って Supabase Auth から実際のユーザー情報を取得
    let userEmail = '';
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        userEmail = authUser.user.email || '';
        console.log('🔍 Auth ユーザー情報:', {
          email: authUser.user.email,
          user_metadata: authUser.user.user_metadata
        });
      }
    } catch (error) {
      console.error('Auth ユーザー情報取得エラー:', error);
    }
    
    if (!userEmail) {
      setStripeError('メールアドレスが取得できませんでした。メールアドレスを手動で入力してください。');
      setShowEmailInput(true);
      return;
    }
    
    setIsSettingUpStripe(true);
    setStripeError('');
    
    try {
      // auth_user_idを使用してAPIを呼び出し
      const userId = supabaseUser.auth_user_id || supabaseUser.id;
      console.log('🔍 Connect Account作成:', { userEmail, userId });
      
      const { onboardingUrl } = await createConnectAccount(userEmail, userId);
      window.location.href = onboardingUrl;
    } catch (error: any) {
      console.error('Stripe Connect 設定エラー:', error);
      setStripeError(error.message || 'Stripe Connect の設定に失敗しました');
    } finally {
      setIsSettingUpStripe(false);
    }
  };

  // メールアドレス手動入力でのStripe Connect設定
  const handleSetupStripeConnectWithEmail = async () => {
    if (!emailInput.trim()) {
      setStripeError('メールアドレスを入力してください');
      return;
    }
    
    if (!supabaseUser) return;
    
    setIsSettingUpStripe(true);
    setStripeError('');
    
    try {
      // auth_user_idを使用してAPIを呼び出し
      const userId = supabaseUser.auth_user_id || supabaseUser.id;
      console.log('🔍 Connect Account作成（手動）:', { email: emailInput.trim(), userId });
      
      const { onboardingUrl } = await createConnectAccount(emailInput.trim(), userId);
      window.location.href = onboardingUrl;
    } catch (error: any) {
      console.error('Stripe Connect 設定エラー:', error);
      setStripeError(error.message || 'Stripe Connect の設定に失敗しました');
    } finally {
      setIsSettingUpStripe(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  // インフルエンサーダッシュボード用の関数
  const loadCallSlots = async () => {
    if (!supabaseUser?.is_influencer) return;

    try {
      setIsLoadingSlots(true);
      setDashboardError('');
      const slots = await getInfluencerCallSlots(supabaseUser.id);
      setCallSlots(slots);
    } catch (err) {
      console.error('Talk枠取得エラー:', err);
      setDashboardError('Talk枠の取得に失敗しました');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadCallSlots();
  };

  const handleDelete = async (callSlotId: string) => {
    if (!confirm('このTalk枠を削除してもよろしいですか？')) return;

    try {
      await deleteCallSlot(callSlotId);
      loadCallSlots();
    } catch (err) {
      console.error('削除エラー:', err);
      alert('Talk枠の削除に失敗しました');
    }
  };

  const handleTogglePublish = async (callSlotId: string, currentStatus: boolean) => {
    try {
      await toggleCallSlotPublish(callSlotId, !currentStatus);
      loadCallSlots();
    } catch (err) {
      console.error('公開状態変更エラー:', err);
      alert('公開状態の変更に失敗しました');
    }
  };

  const getRankColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'from-yellow-400 to-amber-500';
      case 'purple': return 'from-purple-500 to-indigo-600';
      case 'blue': return 'from-blue-500 to-cyan-600';
      case 'green': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50';
      case 'epic': return 'border-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50';
      case 'rare': return 'border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50';
      case 'common': return 'border-gray-400 bg-gradient-to-r from-gray-50 to-gray-100';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // プロフィール保存処理（表示名・自己紹介のみ）
  const handleSaveProfile = async () => {
    if (!supabaseUser) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // 表示名のバリデーション
      if (!editedDisplayName.trim()) {
        setError('表示名を入力してください');
        setSaving(false);
        return;
      }
      
      // プロフィール情報を更新（画像は自動保存されるため除外）
      await updateUserProfile(supabaseUser.id, {
        display_name: editedDisplayName.trim(),
        bio: editedBio.trim(),
      });
      
      // ユーザー情報を再取得
      await refreshUser();
      
      setIsEditingProfile(false);
      setSuccessMessage('プロフィールを更新しました！');
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      console.error('プロフィール保存エラー:', err);
      setError(err.message || 'プロフィールの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // プロフィール画像の変更（自動保存）
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabaseUser) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || '画像ファイルが無効です');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // プレビュー生成
      const preview = await getImagePreviewUrl(file);
      setImagePreview(preview);
      
      // 画像をアップロード
      await updateProfileImage(supabaseUser.id, file);
      
      // ユーザー情報を再取得
      await refreshUser();
      
      setSuccessMessage('プロフィール画像を更新しました！');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      console.error('画像アップロードエラー:', err);
      setError(err.message || 'プロフィール画像のアップロードに失敗しました');
      setTimeout(() => setError(''), 3000);
      // エラー時は元の画像に戻す
      setImagePreview(supabaseUser.profile_image_url || '');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (type: 'oshi' | 'fan') => {
    if (newTag.trim() && !profile[`${type}_tags`].includes(newTag.trim())) {
      setProfile({
        ...profile,
        [`${type}_tags`]: [...profile[`${type}_tags`], newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (type: 'oshi' | 'fan', index: number) => {
    setProfile({
      ...profile,
      [`${type}_tags`]: profile[`${type}_tags`].filter((_, i) => i !== index)
    });
  };

  const filteredActivities = mockActivityLogs
    .filter(activity => activityFilter === 'all' || activity.type === activityFilter)
    .sort((a, b) => activitySort === 'date' 
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : a.type.localeCompare(b.type)
    );

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: UserIcon },
    { id: 'rank', label: 'ランク・ステータス', icon: Crown },
    { id: 'badges', label: '実績バッジ', icon: Award },
    { id: 'activity', label: '活動ログ', icon: Calendar },
    { id: 'collection', label: 'コレクション', icon: Heart },
    { id: 'privacy', label: 'プライバシー', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 px-3 sm:px-4 md:px-6 pb-8">
      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-yellow-800">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
            <span className="font-medium text-sm md:text-base">デモモード - サンプルデータで表示中</span>
            <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>
      )}

      {/* Profile Header - コンパクト版 */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-xl shadow-lg border border-pink-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative group flex-shrink-0">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-pink-300 shadow-md">
              <img
                src={imagePreview || profile.avatar_url}
                alt={supabaseUser?.display_name || profile.nickname || profile.username}
                className="h-full w-full object-cover"
              />
            </div>
            {!isDemoMode && (
              <label className="absolute -bottom-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-1.5 shadow-md hover:from-pink-600 hover:to-purple-700 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95">
                <Camera className="h-3 w-3" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
            {!isDemoMode && supabaseUser?.is_influencer && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full px-1.5 py-0.5 text-xs font-bold shadow-md">
                ✨
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              {isEditingProfile && !isDemoMode ? (
                <input
                  type="text"
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent border-b border-pink-300 focus:border-pink-500 focus:outline-none px-1 flex-1 min-w-0"
                  placeholder="表示名"
                  maxLength={100}
                />
              ) : (
                <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent truncate">
                  {supabaseUser?.display_name || profile.nickname || profile.username}
                </h1>
              )}
              {!isDemoMode && (
                <>
                  {isEditingProfile ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Save className="h-3 w-3" />
                        <span>{saving ? '保存中...' : '保存'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          if (supabaseUser) {
                            setEditedDisplayName(supabaseUser.display_name);
                            setEditedBio(supabaseUser.bio || '');
                            setImagePreview(supabaseUser.profile_image_url || '');
                          }
                          setError('');
                        }}
                        disabled={saving}
                        className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 rounded text-sm hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-1"
                    >
                      <EditIcon className="h-3 w-3" />
                      <span>編集</span>
                    </button>
                  )}
                </>
              )}
            </div>
            
            {!isDemoMode && user?.email && (
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            )}
            
            {/* 統計情報 - コンパクト版 */}
            {!isDemoMode && (
              <div className="flex space-x-4 mt-2">
                {supabaseUser?.is_influencer ? (
                  <>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">¥{formatPrice(supabaseUser.total_earnings)}</div>
                      <div className="text-xs text-gray-600">収益</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-600">{supabaseUser.total_calls_completed}</div>
                      <div className="text-xs text-gray-600">通話</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-600">{supabaseUser.average_rating?.toFixed(1) || '-'}</div>
                      <div className="text-xs text-gray-600">評価</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-sm font-bold text-pink-600">¥{formatPrice(supabaseUser?.total_spent || profile.total_spent)}</div>
                      <div className="text-xs text-gray-600">支払い</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600">{supabaseUser?.total_calls_purchased || profile.call_count}</div>
                      <div className="text-xs text-gray-600">通話</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-600">{profile.total_points}</div>
                      <div className="text-xs text-gray-600">ポイント</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* メッセージ表示 */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <p className="text-green-600">✓ {successMessage}</p>
          </div>
        )}
      </div>

      {/* Talk枠管理 - タブとは独立して表示 */}
      {!isDemoMode && supabaseUser?.is_influencer && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border-2 border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Talk枠</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>新規作成</span>
            </button>
          </div>

          {/* エラー表示 */}
          {dashboardError && (
            <div className="bg-red-50 border border-red-200 p-2 rounded-lg mb-4">
              <p className="text-xs text-red-600">{dashboardError}</p>
            </div>
          )}

          {/* Talk枠一覧 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
            {isLoadingSlots ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg"></div>
                ))}
              </div>
            ) : callSlots.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 text-sm">まだTalk枠がありません</p>
                <p className="text-xs text-gray-500 mt-1">
                  「新規作成」ボタンから作成できます
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {callSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="text-sm font-bold text-gray-900 truncate">{slot.title}</h5>
                          {slot.is_published ? (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">
                              公開中
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full flex-shrink-0">
                              非公開
                            </span>
                          )}
                        </div>

                        {slot.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{slot.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(slot.scheduled_start_time), 'MM/dd HH:mm', {
                                locale: ja,
                              })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{slot.duration_minutes}分</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>¥{slot.starting_price.toLocaleString()}</span>
                          </div>

                          <div className="text-gray-600">
                            <span className="text-xs">最小: ¥{slot.minimum_bid_increment}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePublish(slot.id, slot.is_published)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={slot.is_published ? '非公開にする' : '公開する'}
                        >
                          {slot.is_published ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="削除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 統計情報 - コンパクト版 */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
              <div className="text-xs text-gray-600">総収益</div>
              <div className="text-sm font-bold text-green-600">
                ¥{supabaseUser.total_earnings.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
              <div className="text-xs text-gray-600">通話数</div>
              <div className="text-sm font-bold text-blue-600">
                {supabaseUser.total_calls_completed}
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
              <div className="text-xs text-gray-600">評価</div>
              <div className="text-sm font-bold text-purple-600">
                {supabaseUser.average_rating?.toFixed(1) || '-'}
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
              <div className="text-xs text-gray-600">枠数</div>
              <div className="text-sm font-bold text-pink-600">
                {callSlots.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-6 gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                aria-label={tab.label}
                title={tab.label}
                className={`flex items-center justify-center py-4 md:py-5 px-2 border-b-4 transition-all duration-300 hover:scale-105 ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 bg-gradient-to-r from-pink-50 to-purple-50'
                    : 'border-transparent text-gray-600 hover:text-pink-600 hover:border-pink-300'
                }`}
              >
                <tab.icon className="h-6 w-6 md:h-7 md:w-7" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">プロフィール設定</h2>
              
              {isDemoMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    💡 デモモードでは編集機能は表示されません。実際のアプリケーションでは、ここでプロフィールを編集できます。
                  </p>
                </div>
              )}
              
              {isEditingProfile && !isDemoMode ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      💡 表示名はヘッダー部分で直接編集できます。自己紹介とタグを編集してください。
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">自己紹介</label>
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value.slice(0, 500))}
                      rows={4}
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm md:text-base resize-none"
                      placeholder="自己紹介を入力してください"
                      maxLength={500}
                    />
                    <div className="text-right text-xs md:text-sm text-gray-500 mt-1">
                      {editedBio.length}/500
                    </div>
                  </div>
                      
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">推しタグ</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.oshi_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center space-x-2"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag('oshi', index)}
                            className="text-pink-500 hover:text-pink-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag('oshi')}
                        className="flex-1 px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm md:text-base"
                        placeholder="推しタグを追加"
                      />
                      <button
                        onClick={() => addTag('oshi')}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors flex-shrink-0"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                        </div>
                      </div>
                      
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">ファンタグ</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.fan_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center space-x-2"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag('fan', index)}
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <X className="h-3 w-3" />
                        </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag('fan')}
                        className="flex-1 px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                        placeholder="ファンタグを追加"
                      />
                      <button
                        onClick={() => addTag('fan')}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex-shrink-0"
                      >
                        <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">自己紹介</h3>
                    <p className="text-sm md:text-base text-gray-600 bg-gray-50 rounded-lg p-3 md:p-4">
                      {supabaseUser?.bio || profile.bio || '自己紹介が設定されていません'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">推しタグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.oshi_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">ファンタグ</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.fan_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rank Tab */}
          {activeTab === 'rank' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Oshiランク & ステータス</h2>
              
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 sm:p-6 border-2 border-pink-200">
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r ${getRankColor(profile.oshi_rank.color)} text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 shadow-lg max-w-full`}>
                    <Crown className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <span className="whitespace-nowrap">{profile.oshi_rank.title}</span>
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 animate-pulse" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">{profile.oshi_rank.description}</p>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{profile.oshi_rank.points}pt</div>
                  <div className="text-xs sm:text-sm text-gray-600">総ポイント</div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">ポイント内訳</h3>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm md:text-base text-gray-600">通話回数</span>
                      <span className="text-sm md:text-base font-semibold whitespace-nowrap">{profile.call_count}回 × 3pt = {profile.call_count * 3}pt</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm md:text-base text-gray-600">通話分数</span>
                      <span className="text-sm md:text-base font-semibold whitespace-nowrap">{profile.call_minutes}分 × 0.5pt = {profile.call_minutes * 0.5}pt</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm md:text-base text-gray-600">入札回数</span>
                      <span className="text-sm md:text-base font-semibold whitespace-nowrap">{profile.bid_count}回 × 1pt = {profile.bid_count}pt</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm md:text-base text-gray-600">イベント参加</span>
                      <span className="text-sm md:text-base font-semibold whitespace-nowrap">{profile.event_count}回 × 2pt = {profile.event_count * 2}pt</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">ランク一覧</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                      <span className="text-sm md:text-base">Newbie</span>
                      <span className="text-xs md:text-sm text-gray-500">0-19pt</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50">
                      <span className="text-sm md:text-base">Regular</span>
                      <span className="text-xs md:text-sm text-gray-500">20-69pt</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-purple-50">
                      <span className="text-sm md:text-base">Devoted</span>
                      <span className="text-xs md:text-sm text-gray-500">70-149pt</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-yellow-50">
                      <span className="text-sm md:text-base">Top Fan</span>
                      <span className="text-xs md:text-sm text-gray-500">150pt+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">実績バッジ</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`border-2 rounded-xl p-6 text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${getBadgeRarityColor(badge.rarity)}`}
                    onClick={() => setSelectedBadge(badge)}
                  >
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <h3 className="font-bold text-gray-800 mb-2">{badge.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                    <div className="text-xs text-gray-500">
                      獲得日: {formatDate(badge.earned_at)}
                    </div>
                    <div className={`mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      badge.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                      badge.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                      badge.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {badge.rarity.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl font-bold text-gray-800">活動ログ</h2>
                
                <div className="flex space-x-4">
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">すべて</option>
                    <option value="call">通話</option>
                    <option value="bid">入札</option>
                    <option value="event">イベント</option>
                  </select>
                  
                  <select
                    value={activitySort}
                    onChange={(e) => setActivitySort(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="date">日付順</option>
                    <option value="type">種類順</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-pink-400 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {activity.type === 'call' && <Video className="h-5 w-5 text-green-500" />}
                          {activity.type === 'bid' && <DollarSign className="h-5 w-5 text-blue-500" />}
                          {activity.type === 'event' && <Users className="h-5 w-5 text-purple-500" />}
                          <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.result === 'success' ? 'bg-green-100 text-green-800' :
                            activity.result === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.result === 'success' ? '成功' :
                             activity.result === 'failed' ? '失敗' : '保留中'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>{formatDate(activity.date)}</span>
                          {activity.influencer_name && (
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{activity.influencer_name}</span>
                            </span>
                          )}
                          {activity.duration && (
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{activity.duration}分</span>
                            </span>
                          )}
                          {activity.amount && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>¥{formatPrice(activity.amount)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection Tab */}
          {activeTab === 'collection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">コレクション</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCollections.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={item.thumbnail}
                        alt={item.influencer_name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {item.duration}分
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{item.influencer_name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{formatDate(item.date)}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">ID: {item.session_id}</span>
                        <button className="text-pink-500 hover:text-pink-700 text-sm font-medium">
                          詳細を見る
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">プライバシー設定</h2>
              
              {isDemoMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    💡 デモモードでは設定変更は無効です。実際のアプリケーションでは、ここでプライバシー設定を変更できます。
                  </p>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">マイページ公開範囲</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value="public"
                        checked={profile.privacy_settings.profile_visibility === 'public'}
                        onChange={(e) => !isDemoMode && setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_visibility: e.target.value as any
                          }
                        })}
                        disabled={isDemoMode}
                        className="text-pink-500"
                      />
                      <Globe className="h-5 w-5 text-green-500" />
                      <span>公開</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value="link_only"
                        checked={profile.privacy_settings.profile_visibility === 'link_only'}
                        onChange={(e) => !isDemoMode && setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_visibility: e.target.value as any
                          }
                        })}
                        disabled={isDemoMode}
                        className="text-pink-500"
                      />
                      <Eye className="h-5 w-5 text-yellow-500" />
                      <span>リンクのみ</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value="private"
                        checked={profile.privacy_settings.profile_visibility === 'private'}
                        onChange={(e) => !isDemoMode && setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            profile_visibility: e.target.value as any
                          }
                        })}
                        disabled={isDemoMode}
                        className="text-pink-500"
                      />
                      <Lock className="h-5 w-5 text-red-500" />
                      <span>非公開</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">通話履歴の公開</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="call_history_visibility"
                        value="public"
                        checked={profile.privacy_settings.call_history_visibility === 'public'}
                        onChange={(e) => !isDemoMode && setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            call_history_visibility: e.target.value as any
                          }
                        })}
                        disabled={isDemoMode}
                        className="text-pink-500"
                      />
                      <Eye className="h-5 w-5 text-green-500" />
                      <span>公開</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="call_history_visibility"
                        value="private"
                        checked={profile.privacy_settings.call_history_visibility === 'private'}
                        onChange={(e) => !isDemoMode && setProfile({
                          ...profile,
                          privacy_settings: {
                            ...profile.privacy_settings,
                            call_history_visibility: e.target.value as any
                          }
                        })}
                        disabled={isDemoMode}
                        className="text-pink-500"
                      />
                      <EyeOff className="h-5 w-5 text-red-500" />
                      <span>非公開</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">{selectedBadge.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedBadge.name}</h3>
              <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
              <div className="text-sm text-gray-500 mb-6">
                獲得日: {formatDate(selectedBadge.earned_at)}
              </div>
              <button
                onClick={() => setSelectedBadge(null)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Call Slot Form Modal */}
      {showCreateForm && supabaseUser?.is_influencer && (
        <CreateCallSlotForm
          influencerId={supabaseUser.id}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
