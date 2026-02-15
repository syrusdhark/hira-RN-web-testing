import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, space, radius } from '../theme';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { useCreatePost } from '../hooks/useCommunityActions';
import { useProfile } from '../context/ProfileContext';

export function CreatePostScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends'>('public');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const visibilityPillRef = useRef<View>(null);
  const createPost = useCreatePost();
  const { profile } = useProfile();
  const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

  const visibilityLabel = visibility === 'public' ? 'Public' : 'Friends';

  const openVisibilityDropdown = () => {
    visibilityPillRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({ x, y, width, height });
      setShowVisibilityDropdown(true);
    });
  };

  const handlePost = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      Alert.alert('Add content', "What's on your mind? Type something to post.");
      return;
    }
    try {
      await createPost.mutateAsync({
        content_type: 'text',
        body: trimmed,
        tags: [],
      });
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create post. Try again.';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>New Post</Text>
        <Pressable
          style={[styles.postButton, createPost.isPending && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={createPost.isPending}
        >
          {createPost.isPending ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </Pressable>
      </View>

      <EnvironmentContainer>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.authorRow}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={24} color={colors.textTertiary} />
              </View>
            )}
            <Text style={styles.youLabel}>You</Text>
            <View ref={visibilityPillRef} collapsable={false}>
              <Pressable
                style={styles.visibilityPill}
                onPress={openVisibilityDropdown}
              >
                <Text style={styles.visibilityText}>{visibilityLabel}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Modal
            visible={showVisibilityDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowVisibilityDropdown(false)}
          >
            <Pressable style={styles.visibilityOverlay} onPress={() => setShowVisibilityDropdown(false)}>
              {dropdownLayout && (
                <Pressable
                  style={[
                    styles.visibilityDropdown,
                    {
                      position: 'absolute',
                      left: dropdownLayout.x,
                      top: dropdownLayout.y + dropdownLayout.height + 4,
                    },
                  ]}
                  onPress={() => {}}
                >
                  <Pressable
                    style={[styles.visibilityOption, visibility === 'public' && styles.visibilityOptionSelected]}
                    onPress={() => { setVisibility('public'); setShowVisibilityDropdown(false); }}
                  >
                    <Text style={[styles.visibilityOptionText, visibility === 'public' && styles.visibilityOptionTextSelected]}>Public</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.visibilityOption, visibility === 'friends' && styles.visibilityOptionSelected]}
                    onPress={() => { setVisibility('friends'); setShowVisibilityDropdown(false); }}
                  >
                    <Text style={[styles.visibilityOptionText, visibility === 'friends' && styles.visibilityOptionTextSelected]}>Friends</Text>
                  </Pressable>
                </Pressable>
              )}
            </Pressable>
          </Modal>

          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind? Start typing or use AI Gen..."
            placeholderTextColor={colors.textTertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.tagRow}>
            <Pressable style={styles.tagPill}>
              <Text style={styles.tagPillText}>@ Tag Friends</Text>
            </Pressable>
            <Pressable style={styles.tagPill}>
              <Text style={styles.tagPillText}># Tag Activity</Text>
            </Pressable>
          </View>

          <Pressable style={styles.aiBanner}>
            <MaterialCommunityIcons name="star-four-points" size={24} color={colors.primaryViolet} />
            <Text style={styles.aiBannerText}>Generate text or art from your thoughts</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
          </Pressable>

          <View style={styles.mediaRow}>
            <Pressable style={styles.mediaOption}>
              <MaterialCommunityIcons name="image-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.mediaLabel}>Photo</Text>
            </Pressable>
            <Pressable style={styles.mediaOption}>
              <MaterialCommunityIcons name="video-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.mediaLabel}>Video</Text>
            </Pressable>
            <Pressable style={styles.mediaOption}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={colors.textSecondary} />
              <Text style={styles.mediaLabel}>Poll</Text>
            </Pressable>
            <Pressable style={styles.mediaOption}>
              <MaterialCommunityIcons name="map-marker-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.mediaLabel}>Location</Text>
            </Pressable>
            <Pressable style={styles.mediaOption}>
              <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.textSecondary} />
              <Text style={styles.mediaLabel}>More options</Text>
            </Pressable>
          </View>
        </ScrollView>
      </EnvironmentContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMidnight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerButton: {
    padding: space.xs,
    width: 40,
  },
  headerTitle: {
    ...typography.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postButton: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    backgroundColor: colors.primaryViolet,
    minWidth: 72,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.7,
  },
  postButtonText: {
    ...typography.sm,
    fontWeight: '700',
    color: colors.textInverse,
  },
  scrollContent: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: 120,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
    gap: space.sm,
  },
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
  youLabel: {
    ...typography.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  visibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    gap: 4,
  },
  visibilityText: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  visibilityOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
  },
  visibilityDropdown: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minWidth: 160,
    overflow: 'hidden',
  },
  visibilityOption: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  visibilityOptionSelected: {
    backgroundColor: colors.primaryViolet + '20',
  },
  visibilityOptionText: {
    ...typography.base,
    color: colors.textPrimary,
  },
  visibilityOptionTextSelected: {
    color: colors.primaryViolet,
    fontWeight: '600',
  },
  contentInput: {
    ...typography.base,
    color: colors.textPrimary,
    minHeight: 120,
    marginBottom: space.lg,
    padding: 0,
  },
  tagRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  tagPill: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  tagPillText: {
    ...typography.sm,
    color: colors.textSecondary,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: space.sm,
    marginBottom: space.lg,
  },
  aiBannerText: {
    ...typography.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  mediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  mediaOption: {
    alignItems: 'center',
    gap: space.xs,
  },
  mediaLabel: {
    ...typography.xs,
    color: colors.textTertiary,
  },
});
