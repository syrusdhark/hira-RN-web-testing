import React from 'react';
import { StyleSheet } from 'react-native';

import { BottomTabBar, TabConfig } from '../components/BottomTabBar';
import { EnvironmentContainer } from '../components/EnvironmentContainer';
import { colors } from '../theme';
import { ShopHomeScreen } from './ShopHomeScreen';
import { AiChatScreen } from './AiChatScreen';
import { ProfileScreen } from './ProfileScreen';
import { CommunityScreen } from './CommunityScreen';
import { WorkoutTrackerScreen } from './WorkoutTrackerScreen';
import type { StartProgramDayPayload } from './ProgramScreen';

const TRACK_TABS: TabConfig[] = [
  { key: 'shop', label: 'Buy', icon: 'storefront-outline', activeColor: colors.textPrimary },
  { key: 'track', label: 'Today', icon: 'lightning-bolt', activeColor: colors.textPrimary },
  { key: 'chat', label: 'Hira', icon: 'chat-processing-outline', iconImage: require('../../assets/hira-icon.png'), activeColor: colors.textPrimary },
  { key: 'community', label: 'Connect', icon: 'account-group-outline', activeColor: colors.textPrimary },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', activeColor: colors.textPrimary },
];

export function TrackHomeScreen({
  onNavigateToWorkout,
  onStartTodayProgramWorkout,
  onNavigateToSleep,
  onNavigateToNutrition,
  onNavigateToHabits,
  onNavigateToCart,
  onNavigateToPersonalInfo,
  onNavigateToAchievements,
  onNavigateToCreatePost,
  onSignOut,
  onNavigateToProgram,
  onNavigateToTemplateCreate,
  onNavigateToMyWorkouts,
  onEditTemplate,
  onNavigateToWorkoutInsights,
}: {
  onNavigateToWorkout?: () => void;
  onStartTodayProgramWorkout?: (payload: StartProgramDayPayload) => void;
  onNavigateToSleep?: () => void;
  onNavigateToNutrition?: () => void;
  onNavigateToHabits?: () => void;
  onNavigateToCart?: () => void;
  onNavigateToPersonalInfo?: () => void;
  onNavigateToAchievements?: () => void;
  onNavigateToCreatePost?: () => void;
  onSignOut?: () => void;
  onNavigateToProgram?: () => void;
  onNavigateToTemplateCreate?: () => void;
  onNavigateToMyWorkouts?: () => void;
  onEditTemplate?: (templateId: string) => void;
  onNavigateToWorkoutInsights?: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState('track');

  const handleTabPress = (key: string) => {
    if (key === 'chat') {
      setActiveTab('chat');
      return;
    }
    setActiveTab(key);
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
            onEditTemplate={onEditTemplate}
            onNavigateToWorkoutInsights={onNavigateToWorkoutInsights}
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
      case 'profile':
        return <ProfileScreen onPersonalInfo={onNavigateToPersonalInfo} onViewAllAchievements={onNavigateToAchievements} onSignOut={onSignOut} />;
      case 'community':
        return <CommunityScreen onNavigateToCreatePost={onNavigateToCreatePost} />;
    }
  };

  return (
    <EnvironmentContainer
      noPadding={activeTab === 'shop' || activeTab === 'track' || activeTab === 'profile' || activeTab === 'community'}
      disableScroll={activeTab === 'shop' || activeTab === 'track' || activeTab === 'chat' || activeTab === 'community'}
      footer={<BottomTabBar tabs={TRACK_TABS} activeTab={activeTab} onTabPress={handleTabPress} />}
    >
      {renderContent()}
    </EnvironmentContainer>
  );
}

const styles = StyleSheet.create({});
