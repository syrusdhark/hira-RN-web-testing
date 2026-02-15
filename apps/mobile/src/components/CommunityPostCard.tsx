import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { colors, radius, space, typography } from '../theme';
import type { CommunityFeedItem } from '../types/community';

const BODY_MAX_LINES = 3;
const CONTENT_TYPE_LABELS: Record<string, string> = {
  progress: 'PROGRESS',
  form_check: 'FORM CHECK',
  question: 'QUESTION',
  achievement: 'ACHIEVEMENT',
  text: 'POST',
  image: 'PHOTO',
  video: 'VIDEO',
};

type CommunityPostCardProps = {
  item: CommunityFeedItem;
  onFollow?: (authorId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onPressAuthor?: (authorId: string) => void;
};

export function CommunityPostCard({
  item,
  onFollow,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: CommunityPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const mediaWidth = width - space.md * 2 - space.md * 2;
  const mediaHeight = Math.min(mediaWidth * 0.6, 240);

  const displayName = item.author_display_name?.trim() || item.author_username || 'User';
  const typeLabel = CONTENT_TYPE_LABELS[item.content_type] ?? 'POST';
  const bodyLines = expanded ? undefined : BODY_MAX_LINES;
  const hasMore = !expanded && item.body.length > 120;
  const firstMedia = Array.isArray(item.media_urls) && item.media_urls.length > 0 ? item.media_urls[0] : null;
  const isVideo = item.content_type === 'video';
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true }).toUpperCase();
    } catch {
      return '--';
    }
  })();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Pressable style={styles.avatarWrap}>
            {item.author_avatar_url ? (
              <Image source={{ uri: item.author_avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={20} color={colors.textTertiary} />
              </View>
            )}
          </Pressable>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.time}>{relativeTime}</Text>
          </View>
          {onFollow && (
            <Pressable
              style={[styles.followBtn, item.is_following_author && styles.followBtnActive]}
              onPress={() => onFollow(item.author_id)}
            >
              <Text style={[styles.followBtnText, item.is_following_author && styles.followBtnTextActive]}>{item.is_following_author ? 'Following' : 'Follow'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.typeTag}>
        <Text style={styles.typeTagText}>{typeLabel}</Text>
      </View>

      {item.body ? (
        <Text style={styles.body} numberOfLines={bodyLines}>
          {item.body}
          {hasMore && (
            <Text style={styles.seeMore} onPress={() => setExpanded(true)}> see more</Text>
          )}
        </Text>
      ) : null}

      {firstMedia ? (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: firstMedia }} style={[styles.media, { width: mediaWidth, height: mediaHeight }]} resizeMode="cover" />
          {isVideo && (
            <View style={styles.playOverlay}>
              <MaterialCommunityIcons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </View>
      ) : null}

      {(item.workout_session_id != null || item.achievement_id != null) && (
        <View style={styles.embed}>
          <MaterialCommunityIcons name="dumbbell" size={20} color={colors.primaryViolet} />
          <Text style={styles.embedText}>Workout linked</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
        </View>
      )}

      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.slice(0, 6).map((t) => (
            <Text key={t} style={styles.tag}>#{t}</Text>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => onLike?.(item.post_id)}>
          <MaterialCommunityIcons
            name={item.is_liked_by_me ? 'heart' : 'heart-outline'}
            size={22}
            color={item.is_liked_by_me ? colors.bodyOrange : colors.textSecondary}
          />
          <Text style={styles.actionCount}>{item.total_likes}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => onComment?.(item.post_id)}>
          <MaterialCommunityIcons name="comment-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.actionCount}>{item.total_comments}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => onShare?.(item.post_id)}>
          <MaterialCommunityIcons name="share-outline" size={22} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.actionSpacer} />
        <Pressable style={styles.actionBtn} onPress={() => onBookmark?.(item.post_id)}>
          <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: { marginBottom: space.sm },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: { marginRight: space.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInfo: { flex: 1, minWidth: 0 },
  authorName: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    ...typography.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryViolet,
  },
  followBtnActive: {
    borderColor: colors.borderDefault,
    backgroundColor: colors.borderSubtle,
  },
  followBtnText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.primaryViolet,
  },
  followBtnTextActive: {
    color: colors.textSecondary,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryViolet + '20',
    marginBottom: space.sm,
  },
  typeTagText: {
    ...typography.xs,
    fontWeight: '700',
    color: colors.primaryViolet,
  },
  body: {
    ...typography.base,
    color: colors.textPrimary,
    marginBottom: space.sm,
  },
  seeMore: {
    color: colors.primaryViolet,
    fontWeight: '600',
  },
  mediaWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: space.sm,
    position: 'relative',
  },
  media: {
    borderRadius: radius.md,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  embed: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.sm,
    backgroundColor: colors.bgCharcoal,
    borderRadius: radius.md,
    marginBottom: space.sm,
    gap: space.sm,
  },
  embedText: {
    ...typography.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginBottom: space.sm,
  },
  tag: {
    ...typography.sm,
    color: colors.primaryIndigo,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  actionSpacer: { flex: 1 },
});
