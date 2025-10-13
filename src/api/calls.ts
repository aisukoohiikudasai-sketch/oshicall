// 通話API関数
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export interface CreateRoomResponse {
  success: boolean;
  roomUrl: string;
  token: string;
  callSlot: {
    title: string;
    scheduled_start_time: string;
    duration_minutes: number;
  };
  timeUntilStart: number;
}

export interface JoinRoomResponse {
  success: boolean;
  roomUrl: string;
  token: string;
  userName: string;
}

export interface EndCallResponse {
  success: boolean;
  duration: number;
  message: string;
}

export interface CallStatusResponse {
  status: string;
  scheduled_start_time: string;
  duration_minutes: number;
  time_until_start_seconds: number;
  participants: {
    influencer_joined: boolean;
    fan_joined: boolean;
  };
  can_join: boolean;
  room_created: boolean;
}

/**
 * 通話ルームを作成
 */
export const createCallRoom = async (
  purchasedSlotId: string,
  userId: string
): Promise<CreateRoomResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/calls/create-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchasedSlotId, userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'ルーム作成に失敗しました');
  }

  return response.json();
};

/**
 * 通話ルームに参加
 */
export const joinCallRoom = async (
  purchasedSlotId: string,
  userId: string
): Promise<JoinRoomResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/calls/join-room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchasedSlotId, userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'ルーム参加に失敗しました');
  }

  return response.json();
};

/**
 * 通話を終了
 */
export const endCall = async (
  purchasedSlotId: string,
  userId: string
): Promise<EndCallResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/calls/end-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purchasedSlotId, userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '通話終了に失敗しました');
  }

  return response.json();
};

/**
 * 通話ステータスを取得
 */
export const getCallStatus = async (
  purchasedSlotId: string
): Promise<CallStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/calls/status/${purchasedSlotId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'ステータス取得に失敗しました');
  }

  return response.json();
};

