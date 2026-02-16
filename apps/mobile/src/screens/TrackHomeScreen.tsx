import React from 'react';
import { StyleSheet } from 'react-native';

import { BottomTabBar, TabConfig } from '../components/BottomTabBar';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { colors } from '../theme';
import { ShopHomeScreen } from './ShopHomeScreen';
import { AiChatScreen } from './AiChatScreen';
import { CommunityScreen } from './CommunityScreen';
import { WorkoutTrackerScreen } from './WorkoutTrackerScreen';
import { WorkoutInsightsScreen } from './WorkoutInsightsScreen';
import type { StartProgramDayPayload } from './ProgramScreen';

const TRACK_TABS: TabConfig[] = [
  { key: 'shop', label: 'Buy', icon: 'storefront-outline', activeColor: colors.textPrimary },
  { key: 'track', label: 'Today', icon: 'lightning-bolt', activeColor: colors.textPrimary },
  { key: 'chat', label: 'Hira', icon: 'chat-processing-outline', iconImage: require('../../assets/hira-icon.png'), activeColor: colors.textPrimary },
  { key: 'community', label: 'Connect', icon: 'account-group-outline', activeColor: colors.textPrimary },
  { key: 'progress', label: 'Progress', icon: 'chart-line', activeColor: colors.textPrimary },
];

export function TrackHomeScreen({
  activeTab: activeTabProp = 'track',
  onTabChange,
  onNavigateToWorkout,
  onStartTodayProgramWorkout,
  onNavigateToSleep,
  onNavigateToNutrition,
  onNavigateToHabits,
  onNavigateToCart,
  onNavigateToPersonalInfo,
  onNavigateToPreferences,
  onNavigateToIntegrations,
  onNavigateToHelpSupport,
  onNavigateToAchievements,
  onNavigateToCreatePost,
  onSignOut,
  onNavigateToProgram,
  onNavigateToTemplateCreate,
  onNavigateToMyWorkouts,
  onNavigateToActivityType,
  onStartTemplate,
  onEditTemplate,
  onNavigateToWorkoutInsights,
  onOpenExerciseDetail,
  onNavigateToExercises,
  onNavigateToProfile,
}: {
  activeTab?: string;
  onTabChange?: (key: string) => void;
  onNavigateToWorkout?: () => void;
  onStartTodayProgramWorkout?: (payload: StartProgramDayPayload) => void;
  onNavigateToSleep?: () => void;
  onNavigateToNutrition?: () => void;
  onNavigateToHabits?: () => void;
  onNavigateToCart?: () => void;
  onNavigateToPersonalInfo?: () => void;
  onNavigateToPreferences?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToHelpSupport?: () => void;
  onNavigateToAchievements?: () => void;
  onNavigateToCreatePost?: () => void;
  onSignOut?: () => void;
  onNavigateToProgram?: () => void;
  onNavigateToTemplateCreate?: () => void;
  onNavigateToMyWorkouts?: () => void;
  onNavigateToActivityType?: (activityType: string) => void;
  onStartTemplate?: (templateId: string) => void;
  onEditTemplate?: (templateId: string) => void;
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
            onNavigateToTemplateCreate={onNavigateToTemplateCreate}
            onNavigateToMyWorkouts={onNavigateToMyWorkouts}
            onNavigateToActivityType={onNavigateToActivityType}
            onStartTemplate={onStartTemplate}
            onEditTemplate={onEditTemplate}
            onNavigateToWorkoutInsights={onNavigateToWorkoutInsights}
            onOpenExerciseDetail={onOpenExerciseDetail}
            onNavigateToExercises={onNavigateToExercises}
            onNavigateToProfile={onNavigateToProfile}
            showBackButton={false}
          />
        );
      case 'chat':
        return (
          <AiChatScreen
            onNavigateToWorkout={onNavigateToWorkout}
            onNavigateToSleep={onNavigateToSleep}
            onNavigateToNutrition={onNavigateToNutrition}
          />
        );
      case 'progress':
        return <WorkoutInsightsScreen navigation={{ goBack: () => {} }} />;
      case 'community':
        return <CommunityScreen onNavigateToCreatePost={onNavigateToCreatePost} />;
    }
  };

  return (
    <EnvironmentContainer
      noPadding={activeTab === 'shop' || activeTab === 'track' || activeTab === 'progress' || activeTab === 'community'}
      disableScroll={activeTab === 'shop' || activeTab === 'track' || activeTab === 'chat' || activeTab === 'community'}
      footer={<BottomTabBar tabs={TRACK_TABS} activeTab={activeTab} onTabPress={handleTabPress} />}
    >
      {renderContent()}
    </EnvironmentContainer>
  );
}

const styles = StyleSheet.create({});
