// バックエンドAPIのベースURL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Stripe Customer作成
export const createStripeCustomer = async (
  email: string,
  name: string,
  authUserId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/create-customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, authUserId }),
  });
  
  if (!response.ok) {
    throw new Error('Customer作成に失敗しました');
  }
  
  return response.json();
};

// SetupIntent作成（カード登録用）
export const createSetupIntent = async (customerId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/create-setup-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  });
  
  if (!response.ok) {
    throw new Error('SetupIntent作成に失敗しました');
  }
  
  return response.json();
};

// カード登録完了確認
export const confirmPaymentMethod = async (authUserId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/confirm-payment-method`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authUserId }),
  });
  
  if (!response.ok) {
    throw new Error('カード登録確認に失敗しました');
  }
  
  return response.json();
};

// 与信確保（入札時）
export const authorizePayment = async (
  amount: number,
  customerId: string,
  auctionId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/authorize-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, customerId, auctionId }),
  });
  
  if (!response.ok) {
    throw new Error('与信確保に失敗しました');
  }
  
  return response.json();
};

// 与信キャンセル
export const cancelAuthorization = async (paymentIntentId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/cancel-authorization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId }),
  });
  
  if (!response.ok) {
    throw new Error('与信キャンセルに失敗しました');
  }
  
  return response.json();
};

// 決済確定（落札時）
export const capturePayment = async (
  paymentIntentId: string,
  auctionId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/capture-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId, auctionId }),
  });
  
  if (!response.ok) {
    throw new Error('決済確定に失敗しました');
  }
  
  return response.json();
};

// Stripe Connect Account作成（インフルエンサー用）
export const createConnectAccount = async (
  email: string,
  authUserId: string
) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/create-connect-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authUserId }),
  });
  
  if (!response.ok) {
    throw new Error('Connect Account作成に失敗しました');
  }
  
  return response.json();
};

// インフルエンサーの Stripe アカウント状態を確認
export const getInfluencerStripeStatus = async (authUserId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/stripe/influencer-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authUserId }),
  });
  
  if (!response.ok) {
    throw new Error('インフルエンサー状態の取得に失敗しました');
  }
  
  return response.json();
};


