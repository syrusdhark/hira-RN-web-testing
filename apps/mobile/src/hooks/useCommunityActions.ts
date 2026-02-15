import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { COMMUNITY_FEED_KEY } from './useCommunityFeed';

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (liked) {
        const { error } = await supabase.from('community_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_post_likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
      return { postId, liked: !liked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_FEED_KEY });
    },
  });
}

export function useFollowAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ authorId, follow }: { authorId: string; follow: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (follow) {
        const { error } = await supabase.from('community_follows').insert({
          follower_id: user.id,
          following_id: authorId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('community_follows').delete().eq('follower_id', user.id).eq('following_id', authorId);
        if (error) throw error;
      }
      return { authorId, follow: !follow };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_FEED_KEY });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, body, parentCommentId }: { postId: string; body: string; parentCommentId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          body: body.trim(),
          parent_comment_id: parentCommentId ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return { commentId: data.id, postId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_FEED_KEY });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      content_type: 'text' | 'image' | 'video' | 'progress' | 'form_check' | 'question' | 'achievement';
      body: string;
      title?: string | null;
      media_urls?: string[];
      tags?: string[];
      workout_session_id?: string | null;
      achievement_id?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content_type: params.content_type,
          body: params.body,
          title: params.title ?? null,
          media_urls: params.media_urls ?? [],
          tags: params.tags ?? [],
          workout_session_id: params.workout_session_id ?? null,
          achievement_id: params.achievement_id ?? null,
          moderation_status: 'approved',
        })
        .select('id')
        .single();
      if (error) throw error;
      const postId = data.id;
      const { error: feedError } = await supabase.from('community_feed_items').insert({
        user_id: user.id,
        post_id: postId,
        author_id: user.id,
        score: 0,
        source: 'global',
      });
      if (feedError) throw feedError;
      return { postId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITY_FEED_KEY });
    },
  });
}
