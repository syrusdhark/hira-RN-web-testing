import React from 'react';
import { StyleSheet } from 'react-native';

import { BottomTabBar, TabConfig } from '../components/BottomTabBar';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { colors } from '../theme';
import { ShopHomeScreen } from './ShopHomeScreen';
import { ChatDrawerScreen } from './ChatDrawerScreen';
import { CommunityScreen } from './CommunityScreen';
import { WorkoutTrackerScreen } from './WorkoutTrackerScreen';
import { ProfileScreen } from './ProfileScreen';
import type { StartProgramDayPayload } from './ProgramScreen';

const TRACK_TABS: TabConfig[] = [
  { key: 'shop', label: 'Buy', icon: 'storefront-outline', activeColor: colors.textPrimary },
  { key: 'track', label: 'Today', icon: 'lightning-bolt', activeColor: colors.textPrimary },
  { key: 'chat', label: 'Hira', icon: 'chat-processing-outline', iconImage: require('../../assets/hira-icon.png'), activeColor: colors.textPrimary },
  { key: 'community', label: 'Connect', icon: 'account-group-outline', activeColor: colors.textPrimary },
  { key: 'profile', label: 'Profile', icon: 'account-outline', activeColor: colors.textPrimary },
];

export function TrackHomeScreen({
  activeTab: activeTabProp = 'track',
  onTabChange,
  onNavigateToWorkout,
  onStartTodayProgramWorkout,
  onNavigateToCart,
  onNavigateToPersonalInfo,
  onNavigateToPreferences,
  onNavigateToIntegrations,
  onNavigateToHelpSupport,
  onNavigateToAchievements,
  onNavigateToCreatePost,
  onSignOut,
  onNavigateToProgram,
  onNavigateToMyWorkouts,
  onStartNewWorkout,
  onNavigateToActivityType,
  onStartTemplate,
  onNavigateToWorkoutInsights,
  onOpenExerciseDetail,
  onNavigateToExercises,
  onNavigateToProfile,
}: {
  activeTab?: string;
  onTabChange?: (key: string) => void;
  onNavigateToWorkout?: () => void;
  onStartTodayProgramWorkout?: (payload: StartProgramDayPayload) => void;
  onNavigateToCart?: () => void;
  onNavigateToPersonalInfo?: () => void;
  onNavigateToPreferences?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToHelpSupport?: () => void;
  onNavigateToAchievements?: () => void;
  onNavigateToCreatePost?: () => void;
  onSignOut?: () => void;
  onNavigateToProgram?: () => void;
  onNavigateToMyWorkouts?: () => void;
  onStartNewWorkout?: () => void;
  onNavigateToActivityType?: (activityType: string) => void;
  onStartTemplate?: (templateId: string) => void;
  onNavigateToWorkoutInsights?: () => void;
  onOpenExerciseDetail?: (exerciseId: string, exerciseName: string) => void;
  onNavigateToExercises?: () => void;
  onNavigateToProfile?: () => void;
}) {
  const activeTab = activeTabProp;

  const handleTabPress = (key: string) => {
    onTabChange?.(key);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'shop':
        return <ShopHomeScreen onNavigateToCart={onNavigateToCart} />;
      case 'track':
      default:
        return (
          <WorkoutTrackerScreen
            navigation={{ goBack: () => {} }}
            onNavigateToProgram={onNavigateToProgram}
            onNavigateToMyWorkouts={onNavigateToMyWorkouts}
            onStartNewWorkout={onStartNewWorkout}
            onNavigateToActivityType={onNavigateToActivityType}
            onStartTemplate={onStartTemplate}
            onNavigateToWorkoutInsights={onNavigateToWorkoutInsights}
            onOpenExerciseDetail={onOpenExerciseDetail}
            onNavigateToExercises={onNavigateToExercises}
            onNavigateToProfile={onNavigateToProfile}
            showBackButton={false}
          />
        );
      case 'chat':
        return <ChatDrawerScreen />;
      case 'profile':
        return (
          <ProfileScreen
            navigation={{ goBack: () => {} }}
            onPersonalInfo={onNavigateToPersonalInfo}
            onPreferences={onNavigateToPreferences}
            onIntegrations={onNavigateToIntegrations}
            onHelpSupport={onNavigateToHelpSupport}
            onViewAllAchievements={onNavigateToAchievements}
            onSignOut={onSignOut}
          />
        );
      case 'community':
        return <CommunityScreen onNavigateToCreatePost={onNavigateToCreatePost} />;
    }
  };

  return (
    <EnvironmentContainer
      noPadding={activeTab === 'shop' || activeTab === 'track' || activeTab === 'chat' || activeTab === 'profile' || activeTab === 'community'}
      disableScroll={activeTab === 'shop' || activeTab === 'track' || activeTab === 'chat' || activeTab === 'community' || activeTab === 'profile'}
      solidBackground={activeTab === 'chat' ? '#000000' : undefined}
      footer={<BottomTabBar tabs={TRACK_TABS} activeTab={activeTab} onTabPress={handleTabPress} />}
    >
      {renderContent()}
    </EnvironmentContainer>
  );
}

const styles = StyleSheet.create({});
