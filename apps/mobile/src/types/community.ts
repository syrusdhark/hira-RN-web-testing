/** Tab key for community feed */
export type FeedTab = 'for_you' | 'following' | 'trending';

/** Single item returned by get_community_feed RPC */
export interface CommunityFeedItem {
  post_id: string;
  author_id: string;
  author_display_name: string;
  author_username: string;
  author_avatar_url: string | null;
  content_type: 'text' | 'image' | 'video' | 'progress' | 'form_check' | 'question' | 'achievement';
  title: string | null;
  body: string;
  media_urls: string[];
  tags: string[];
  workout_session_id: string | null;
  achievement_id: string | null;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  created_at: string;
  is_liked_by_me: boolean;
  is_bookmarked_by_me: boolean;
  is_following_author: boolean;
  /** Opaque cursor for pagination (pass as next_cursor) */
  cursor?: { score: number; created_at: string; id: string };
}

/** Response shape from get_community_feed RPC */
export interface CommunityFeedResponse {
  items: CommunityFeedItem[];
  next_cursor: { score: number; created_at: string; id: string } | null;
}
