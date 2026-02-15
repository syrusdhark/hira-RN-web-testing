import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CommunityFeedItem, CommunityFeedResponse, FeedTab } from '../types/community';

export const COMMUNITY_FEED_KEY = ['communityFeed'] as const;

const DEFAULT_PAGE_SIZE = 20;

function parseFeedResponse(payload: unknown): CommunityFeedResponse {
  const r = payload as { items?: unknown; next_cursor?: unknown };
  const items = Array.isArray(r?.items) ? r.items : [];
  return {
    items: items as CommunityFeedItem[],
    next_cursor: r?.next_cursor ?? null,
  };
}

export function useCommunityFeed(tab: FeedTab, limit: number = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...COMMUNITY_FEED_KEY, tab],
    queryFn: async ({ pageParam }: { pageParam: unknown }) => {
      const { data, error } = await supabase.rpc('get_community_feed', {
        p_tab: tab,
        p_cursor: pageParam ?? null,
        p_limit: limit,
      });
      if (error) throw error;
      return parseFeedResponse(data);
    },
    initialPageParam: null as unknown,
    getNextPageParam: (lastPage): unknown => lastPage.next_cursor ?? undefined,
  });
}

export function useCommunityFeedFlatItems(tab: FeedTab, limit?: number): {
  items: CommunityFeedItem[];
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  refetch: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
} {
  const q = useCommunityFeed(tab, limit);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  return {
    items,
    isLoading: q.isLoading,
    error: q.error as Error | null,
    fetchNextPage: q.fetchNextPage,
    refetch: q.refetch,
    hasNextPage: q.hasNextPage ?? false,
    isFetchingNextPage: q.isFetchingNextPage,
  };
}

/** Optional: invalidate feed when post counts change (Realtime). Enable in Supabase dashboard for community_posts. */
export function useCommunityPostRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('community_posts_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: COMMUNITY_FEED_KEY });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
