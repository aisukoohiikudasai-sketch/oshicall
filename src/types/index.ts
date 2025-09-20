export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  total_spent: number;
  successful_bids: number;
  created_at: string;
}

export interface Influencer {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  description: string;
  follower_count: number;
  total_earned: number;
  total_talks: number;
  rating: number;
  created_at: string;
}

export interface TalkSession {
  id: string;
  influencer_id: string;
  influencer: Influencer;
  title: string;
  description: string;
  host_message: string;
  start_time: string;
  end_time: string;
  auction_end_time: string;
  starting_price: number;
  current_highest_bid: number;
  winner_id?: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface Bid {
  id: string;
  talk_session_id: string;
  user_id: string;
  user: User;
  amount: number;
  created_at: string;
}

export interface Message {
  id: string;
  talk_session_id: string;
  user_id: string;
  content: string;
  created_at: string;
}