import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, BackHandler, Platform, Modal, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import { TrackHomeScreen } from './screens/TrackHomeScreen';
import { WorkoutTrackerScreen } from './screens/WorkoutTrackerScreen';
import { ProgramScreen } from './screens/ProgramScreen';
import { CreateProgramScreen } from './screens/CreateProgramScreen';
import { TemplateCreateScreen } from './screens/TemplateCreateScreen';
import { TemplateSessionScreen, type TemplateSessionScreenProps } from './screens/TemplateSessionScreen';
import { MyWorkoutsScreen } from './screens/MyWorkoutsScreen';
import { WorkoutHistoryScreen } from './screens/WorkoutHistoryScreen';
import { WorkoutSessionDetailScreen } from './screens/WorkoutSessionDetailScreen';
import { ExerciseSearchScreen } from './screens/ExerciseSearchScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { SignInScreen, SignUpScreen } from './screens/AuthScreen';
import { colors } from './theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { ActivityAnalyticsScreen } from './screens/ActivityAnalyticsScreen';
import { WorkoutInsightsScreen } from './screens/WorkoutInsightsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { WelcomeSplashScreen } from './screens/WelcomeSplashScreen';
import { PersonalInfoScreen } from './screens/PersonalInfoScreen';
import { PreferencesScreen } from './screens/PreferencesScreen';
import { IntegrationsScreen } from './screens/IntegrationsScreen';
import { HelpSupportScreen } from './screens/HelpSupportScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { ActivityTypeWorkoutsScreen } from './screens/ActivityTypeWorkoutsScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';
import { ExercisesScreen } from './screens/ExercisesScreen';
import { AddExercisesForSessionScreen } from './screens/AddExercisesForSessionScreen';
import { ProfileScreen } from './screens/ProfileScreen';

import { CartProvider } from './context/CartContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { CartScreen } from './screens/CartScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AuthStack = createNativeStackNavigator();

type ScreenKey = 'track' | 'workout' | 'workout-insights' | 'program' | 'program-create' | 'template-create' | 'template-session' | 'add-exercises-for-session' | 'my-workouts' | 'activity-type-workouts' | 'exercises' | 'workout-history' | 'workout-session-detail' | 'exercise-detail' | 'achievements' | 'cart' | 'activity-analytics' | 'onboarding' | 'personal-info' | 'create-post' | 'preferences' | 'integrations' | 'help-support' | 'profile';

function AuthenticatedLayout({
  resetToScreen,
  currentScreen,
  children,
}: {
  resetToScreen: (s: ScreenKey) => void;
  currentScreen: ScreenKey;
  children: React.ReactNode;
}) {
  const { profile, loading, refreshProfile } = useProfile();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgMidnight, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primaryViolet} />
      </View>
    );
  }
  if (!profile?.full_name) {
    return (
      <OnboardingScreen
        onComplete={async () => {
          resetToScreen('track');
          await refreshProfile();
        }}
      />
    );
  }
  return <>{children}</>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenWelcomeSplash, setHasSeenWelcomeSplash] = useState<boolean | null>(null);
  const [screenStack, setScreenStack] = useState<ScreenKey[]>(['track']);
  const currentScreen = screenStack[screenStack.length - 1];
  const [analyticsInitialTab, setAnalyticsInitialTab] = useState<'Steps' | 'Distance' | 'Pace'>('Steps');

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [sessionTemplateId, setSessionTemplateId] = useState<string | null>(null);
  const [sessionProgramId, setSessionProgramId] = useState<string | null>(null);
  const [sessionProgramDayId, setSessionProgramDayId] = useState<string | null>(null);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [exerciseDetailExerciseId, setExerciseDetailExerciseId] = useState<string | null>(null);
  const [exerciseDetailExerciseName, setExerciseDetailExerciseName] = useState<string | null>(null);
  const [sessionInitialExercises, setSessionInitialExercises] = useState<Array<{ name: string; muscle: string; exerciseId?: string | null }> | null>(null);
  const [trackActiveTab, setTrackActiveTab] = useState<string>('track');
  const [activityTypeForScreen, setActivityTypeForScreen] = useState<string | null>(null);

  const navigateTo = useCallback((screen: ScreenKey) => {
    setScreenStack(prev => (prev[prev.length - 1] === screen ? prev : [...prev, screen]));
  }, []);
  const goBack = useCallback(() => {
    setScreenStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);
  const resetToScreen = useCallback((screen: ScreenKey) => {
    setScreenStack([screen]);
  }, []);

  const [exerciseSearchVisible, setExerciseSearchVisible] = useState(false);
  const [onExerciseSelected, setOnExerciseSelected] = useState<((exercise: any) => void) | undefined>();

  const openExerciseSearch = (callback: (exercise: any) => void) => {
    setOnExerciseSelected(() => callback);
    setExerciseSearchVisible(true);
  };

  const handleEditTemplate = (templateId: string, _returnScreen: 'track' | 'workout' = 'workout') => {
    setEditingTemplateId(templateId);
    navigateTo('template-create');
  };

  const handleCreateNewTemplate = (_returnScreen: 'track' | 'workout' = 'workout') => {
    setEditingTemplateId(null);
    setSessionTemplateId(null);
    setSessionInitialExercises(null);
    navigateTo('template-session');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(async (err) => {
      const msg = err?.message ?? String(err);
      const isInvalidRefreshToken =
        (msg.includes('Refresh Token') && msg.includes('Not Found')) ||
        msg.includes('Invalid Refresh Token');
      if (isInvalidRefreshToken) {
        await supabase.auth.signOut();
        setSession(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!loading) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('@hira_hasSeenWelcomeSplash').then((value) => {
      setHasSeenWelcomeSplash(value === 'true');
    });
  }, []);

  useEffect(() => {
    if (!session || Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (screenStack.length > 1) {
        goBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [session, screenStack.length, goBack]);

  if (hasSeenWelcomeSplash === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.bgMidnight, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryViolet} />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (hasSeenWelcomeSplash === false) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <WelcomeSplashScreen
          onComplete={async () => {
            await AsyncStorage.setItem('@hira_hasSeenWelcomeSplash', 'true');
            setHasSeenWelcomeSplash(true);
          }}
        />
      </GestureHandlerRootView>
    );
  }

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.bgMidnight, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryViolet} />
        </View>
      </GestureHandlerRootView>
    )
  }

  if (!session) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <StatusBar style="light" />
            <NavigationContainer>
              <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
                <AuthStack.Screen name="SignIn" component={SignInScreen} />
                <AuthStack.Screen name="SignUp" component={SignUpScreen} />
              </AuthStack.Navigator>
            </NavigationContainer>
          </CartProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <CartProvider>
            <ProfileProvider>
              <AuthenticatedLayout resetToScreen={resetToScreen} currentScreen={currentScreen}>
                <StatusBar style="light" />
                {currentScreen === 'track' ? (
                  <TrackHomeScreen
                    activeTab={trackActiveTab}
                    onTabChange={setTrackActiveTab}
                    onNavigateToWorkout={() => navigateTo('workout')}
                    onStartTodayProgramWorkout={(payload) => {
                      React.startTransition(() => {
                        setSessionTemplateId(payload.templateId);
                        setSessionProgramId(payload.programId ?? null);
                        setSessionProgramDayId(payload.programDayId ?? null);
                        navigateTo('template-session');
                      });
                    }}

                    onNavigateToCart={() => navigateTo('cart')}
                    onNavigateToPersonalInfo={() => navigateTo('personal-info')}
                    onNavigateToPreferences={() => navigateTo('preferences')}
                    onNavigateToIntegrations={() => navigateTo('integrations')}
                    onNavigateToHelpSupport={() => navigateTo('help-support')}
                    onNavigateToAchievements={() => navigateTo('achievements')}
                    onNavigateToCreatePost={() => navigateTo('create-post')}
                    onSignOut={() => supabase.auth.signOut()}
                    onNavigateToProgram={() => navigateTo('program')}
                    onNavigateToTemplateCreate={() => handleCreateNewTemplate('track')}
                    onNavigateToMyWorkouts={() => navigateTo('my-workouts')}
                    onNavigateToActivityType={(type) => {
                      setActivityTypeForScreen(type);
                      navigateTo('activity-type-workouts');
                    }}
                    onStartTemplate={(templateId) => {
                      setSessionTemplateId(templateId);
                      setSessionInitialExercises(null);
                      navigateTo('template-session');
                    }}
                    onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'track')}
                    onNavigateToWorkoutInsights={() => navigateTo('workout-insights')}
                    onOpenExerciseDetail={(id, name) => {
                      setExerciseDetailExerciseId(id);
                      setExerciseDetailExerciseName(name);
                      navigateTo('exercise-detail');
                    }}
                    onNavigateToExercises={() => navigateTo('exercises')}
                    onNavigateToProfile={() => navigateTo('profile')}
                  />
                ) : currentScreen === 'profile' ? (
                  <ProfileScreen
                    navigation={{ goBack }}
                    onPersonalInfo={() => navigateTo('personal-info')}
                    onPreferences={() => navigateTo('preferences')}
                    onIntegrations={() => navigateTo('integrations')}
                    onHelpSupport={() => navigateTo('help-support')}
                    onViewAllAchievements={() => navigateTo('achievements')}
                    onSignOut={() => supabase.auth.signOut()}
                  />
                ) : currentScreen === 'create-post' ? (
                  <CreatePostScreen navigation={{ goBack }} />
                ) : currentScreen === 'cart' ? (
                  <CartScreen navigation={{ goBack }} />
                ) : currentScreen === 'personal-info' ? (
                  <PersonalInfoScreen onClose={goBack} />
                ) : currentScreen === 'preferences' ? (
                  <PreferencesScreen navigation={{ goBack }} />
                ) : currentScreen === 'integrations' ? (
                  <IntegrationsScreen navigation={{ goBack }} />
                ) : currentScreen === 'help-support' ? (
                  <HelpSupportScreen navigation={{ goBack }} />
                ) : currentScreen === 'achievements' ? (
                  <AchievementsScreen navigation={{ goBack }} />
                ) : currentScreen === 'workout-insights' ? (
                  <WorkoutInsightsScreen navigation={{ goBack }} />
                ) : currentScreen === 'workout' ? (
                  <WorkoutTrackerScreen
                    navigation={{ goBack }}
                    onNavigateToProgram={() => navigateTo('program')}
                    onNavigateToTemplateCreate={() => handleCreateNewTemplate('workout')}
                    onNavigateToMyWorkouts={() => navigateTo('my-workouts')}
                    onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'workout')}
                    onNavigateToWorkoutInsights={() => navigateTo('workout-insights')}
                  />
                ) : currentScreen === 'onboarding' ? (
                  <OnboardingScreen onComplete={() => resetToScreen('track')} />
                ) : currentScreen === 'activity-analytics' ? (
                  <ActivityAnalyticsScreen
                    initialTab={analyticsInitialTab}
                    navigation={{ goBack }}
                  />
                ) : currentScreen === 'program-create' ? (
                  <CreateProgramScreen
                    navigation={{ goBack }}
                    onSuccess={() => goBack()}
                  />
                ) : currentScreen === 'program' ? (
                  <ProgramScreen
                    navigation={{ goBack }}
                    onViewProgramDay={(payload) => {
                      React.startTransition(() => {
                        setEditingTemplateId(payload.templateId);
                        setSessionProgramId(payload.programId ?? null);
                        setSessionProgramDayId(payload.programDayId ?? null);
                        navigateTo('template-create');
                      });
                    }}
                    onStartProgramDay={(payload) => {
                      React.startTransition(() => {
                        setSessionTemplateId(payload.templateId);
                        setSessionProgramId(payload.programId ?? null);
                        setSessionProgramDayId(payload.programDayId ?? null);
                        navigateTo('template-session');
                      });
                    }}
                    onCreateProgram={() => navigateTo('program-create')}
                  />
                ) : currentScreen === 'template-create' ? (
                  <TemplateCreateScreen
                    navigation={{
                      goBack: () => {
                        setEditingTemplateId(null);
                        setSessionProgramId(null);
                        setSessionProgramDayId(null);
                        goBack();
                      }
                    }}
                    onStartSession={() => {
                      if (editingTemplateId) {
                        React.startTransition(() => {
                          setSessionTemplateId(editingTemplateId);
                          navigateTo('template-session');
                        });
                      } else {
                        console.error('App: Cannot start session - no editingTemplateId');
                      }
                    }}
                    onAddExercise={openExerciseSearch}
                    templateId={editingTemplateId}
                  />
                ) : currentScreen === 'exercises' ? (
                  <ExercisesScreen
                    navigation={{ goBack }}
                    onOpenExerciseDetail={(id, name) => {
                      setExerciseDetailExerciseId(id);
                      setExerciseDetailExerciseName(name);
                      navigateTo('exercise-detail');
                    }}
                  />
                ) : currentScreen === 'activity-type-workouts' ? (
                  <ActivityTypeWorkoutsScreen
                    navigation={{ goBack: () => { setActivityTypeForScreen(null); goBack(); } }}
                    activityType={activityTypeForScreen ?? 'Workouts'}
                    onStartTemplate={(templateId) => {
                      React.startTransition(() => {
                        setSessionTemplateId(templateId);
                        setSessionInitialExercises(null);
                        navigateTo('template-session');
                      });
                    }}
                    onEditTemplate={handleEditTemplate}
                  />
                ) : currentScreen === 'add-exercises-for-session' ? (
                  <AddExercisesForSessionScreen
                    navigation={{ goBack }}
                    onStartWorkout={(exercises) => {
                      setSessionInitialExercises(exercises);
                      setSessionTemplateId(null);
                      navigateTo('template-session');
                    }}
                    onAddExercise={openExerciseSearch}
                  />
                ) : currentScreen === 'my-workouts' ? (
                  <MyWorkoutsScreen
                    navigation={{ goBack }}
                    onNavigateToWorkoutHistory={() => navigateTo('workout-history')}
                    onCreateNew={handleCreateNewTemplate}
                    onStartTemplate={(templateId) => {
                      React.startTransition(() => {
                        setSessionTemplateId(templateId);
                        setSessionInitialExercises(null);
                        navigateTo('template-session');
                      });
                    }}
                    onEditTemplate={handleEditTemplate}
                  />
                ) : currentScreen === 'workout-history' ? (
                  <WorkoutHistoryScreen
                    navigation={{ goBack }}
                    onSessionPress={(sessionId) => {
                      setWorkoutSessionId(sessionId);
                      navigateTo('workout-session-detail');
                    }}
                  />
                ) : currentScreen === 'workout-session-detail' ? (
                  <WorkoutSessionDetailScreen
                    sessionId={workoutSessionId}
                    navigation={{ goBack: () => { setWorkoutSessionId(null); goBack(); } }}
                  />
                ) : currentScreen === 'exercise-detail' ? (
                  <ExerciseDetailScreen
                    exerciseId={exerciseDetailExerciseId}
                    exerciseName={exerciseDetailExerciseName ?? ''}
                    navigation={{
                      goBack: () => {
                        setExerciseDetailExerciseId(null);
                        setExerciseDetailExerciseName(null);
                        goBack();
                      },
                    }}
                  />
                ) : currentScreen === 'template-session' ? (
                  <TemplateSessionScreen
                    templateId={sessionTemplateId}
                    workoutProgramId={sessionProgramId ?? undefined}
                    workoutProgramDayId={sessionProgramDayId ?? undefined}
                    navigation={{
                      goBack: () => {
                        setSessionTemplateId(null);
                        setSessionProgramId(null);
                        setSessionProgramDayId(null);
                        setSessionInitialExercises(null);
                        goBack();
                      },
                    }}
                    onAddExercise={openExerciseSearch}
                    onPressExercise={(id, name) => {
                      setExerciseDetailExerciseId(id);
                      setExerciseDetailExerciseName(name);
                      navigateTo('exercise-detail');
                    }}
                    initialExercises={sessionInitialExercises}
                    onInitialExercisesConsumed={() => setSessionInitialExercises(null)}
                  />
                ) : (
                  <WorkoutTrackerScreen
                    navigation={{ goBack }}
                    onNavigateToProgram={() => navigateTo('program')}
                    onNavigateToTemplateCreate={() => handleCreateNewTemplate('workout')}
                    onNavigateToMyWorkouts={() => navigateTo('my-workouts')}
                    onNavigateToActivityType={(type) => {
                      setActivityTypeForScreen(type);
                      navigateTo('activity-type-workouts');
                    }}
                    onStartTemplate={(templateId) => {
                      setSessionTemplateId(templateId);
                      setSessionInitialExercises(null);
                      navigateTo('template-session');
                    }}
                    onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'workout')}
                    onNavigateToWorkoutInsights={() => navigateTo('workout-insights')}
                  />
                )}

                <Modal
                  visible={exerciseSearchVisible}
                  animationType="slide"
                  presentationStyle="pageSheet"
                  onRequestClose={() => setExerciseSearchVisible(false)}
                >
                  <ExerciseSearchScreen
                    onClose={() => setExerciseSearchVisible(false)}
                    onSelectExercise={(ex) => {
                      onExerciseSelected?.(ex);
                      setExerciseSearchVisible(false);
                    }}
                  />
                </Modal>
              </AuthenticatedLayout>
            </ProfileProvider>
          </CartProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
