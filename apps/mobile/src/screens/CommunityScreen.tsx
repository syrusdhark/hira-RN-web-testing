import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { useCommunityFeedFlatItems, useCommunityPostRealtime } from '../hooks/useCommunityFeed';
import { useLikePost, useFollowAuthor } from '../hooks/useCommunityActions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, typography } from '../theme';
import { TAB_BAR_ROW_HEIGHT } from '../constants/layout';
import type { FeedTab } from '../types/community';
import type { CommunityFeedItem } from '../types/community';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'for_you', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
];

export function CommunityScreen({
  onNavigateToCreatePost,
  onNavigateToPostDetail,
}: {
  onNavigateToCreatePost?: () => void;
  onNavigateToPostDetail?: (postId: string) => void;
} = {}) {
  const [activeTab, setActiveTab] = React.useState<FeedTab>('for_you');
  const {
    items,
    isLoading,
    error,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityFeedFlatItems(activeTab);
  const insets = useSafeAreaInsets();
  const likePost = useLikePost();
  const followAuthor = useFollowAuthor();
  useCommunityPostRealtime();
  const listPaddingBottom = TAB_BAR_ROW_HEIGHT + insets.bottom;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: CommunityFeedItem }) => (
      <CommunityPostCard
        item={item}
        onFollow={() => followAuthor.mutate({ authorId: item.author_id, follow: item.is_following_author })}
        onLike={() => likePost.mutate({ postId: item.post_id, liked: item.is_liked_by_me })}
        onComment={() => onNavigateToPostDetail?.(item.post_id)}
        onShare={() => {}}
        onBookmark={() => {}}
      />
    ),
    [onNavigateToPostDetail, followAuthor, likePost]
  );

  const keyExtractor = useCallback((item: CommunityFeedItem) => item.post_id, []);

  const listHeader = (
    <View style={styles.listHeaderWrap}>
      <View style={styles.tabRow}>
        {TABS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {onNavigateToCreatePost ? (
        <Pressable style={styles.createPostButtonFull} onPress={onNavigateToCreatePost}>
          <Text style={styles.createPostButtonFullText}>Create Post</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const emptyComponent =
    error && items.length === 0 ? (
      <View style={styles.empty}>
        <Text style={styles.errorText}>Something went wrong. Pull to try again.</Text>
      </View>
    ) : (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {activeTab === 'following'
            ? 'Follow people to see their posts here.'
            : 'No posts yet. Be the first to share!'}
        </Text>
      </View>
    );

  const headerPaddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 44;
  return (
    <EnvironmentContainer disableScroll noPadding>
      <View style={styles.screenContent}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <Text style={styles.title}>Hira Feed</Text>
        </View>
        {isLoading && items.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primaryViolet} />
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={emptyComponent}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: listPaddingBottom },
              items.length === 0 && styles.listContentEmpty,
            ]}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryViolet}
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primaryViolet} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </EnvironmentContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  title: {
    ...typography.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listHeaderWrap: {
    marginBottom: space.sm,
  },
  tabRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.sm,
  },
  createPostButtonFull: {
    width: '100%',
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostButtonFullText: {
    ...typography.base,
    fontWeight: '700',
    color: colors.textInverse,
  },
  tab: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryViolet,
  },
  tabText: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primaryViolet,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: space.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  empty: {
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.base,
    color: colors.bodyOrange,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: space.md,
    alignItems: 'center',
  },
});
