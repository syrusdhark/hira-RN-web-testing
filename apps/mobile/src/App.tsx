import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, BackHandler, Platform, Modal, Text } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import { TrackHomeScreen } from './screens/TrackHomeScreen';
import { SleepTrackerScreen } from './screens/SleepTrackerScreen';
import { WorkoutTrackerScreen } from './screens/WorkoutTrackerScreen';
import { ProgramScreen } from './screens/ProgramScreen';
import { CreateProgramScreen } from './screens/CreateProgramScreen';
import { TemplateCreateScreen } from './screens/TemplateCreateScreen';
import { TemplateSessionScreen, type TemplateSessionScreenProps } from './screens/TemplateSessionScreen';
import { NutritionDetailsScreen } from './screens/NutritionDetailsScreen';
import { MyWorkoutsScreen } from './screens/MyWorkoutsScreen';
import { WorkoutHistoryScreen } from './screens/WorkoutHistoryScreen';
import { WorkoutSessionDetailScreen } from './screens/WorkoutSessionDetailScreen';
import { ExerciseSearchScreen } from './screens/ExerciseSearchScreen';
import { FoodSearchScreen } from './screens/FoodSearchScreen';
import { HabitTrackerScreen } from './screens/HabitTrackerScreen';
import { HabitInsightsScreen } from './screens/HabitInsightsScreen';
import { HabitDailyInsightsScreen } from './screens/HabitDailyInsightsScreen';
import { CreateHabitScreen } from './screens/CreateHabitScreen';
import { EditHabitScreen } from './screens';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { HealthDataTestScreen } from './screens/HealthDataTestScreen';
import { SignInScreen, SignUpScreen } from './screens/AuthScreen';
import { colors } from './theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { NutritionProvider } from './context/NutritionContext';
import { ActivityAnalyticsScreen } from './screens/ActivityAnalyticsScreen';
import { WorkoutInsightsScreen } from './screens/WorkoutInsightsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { PersonalInfoScreen } from './screens/PersonalInfoScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';

import { CartProvider } from './context/CartContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { CartScreen } from './screens/CartScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// #region agent log
const _appLog = (msg: string, data: Record<string, unknown>) => { const p = { location: 'App.tsx', message: msg, data, timestamp: Date.now(), hypothesisId: (data.hypothesisId as string) || 'H3' }; console.log('[DEBUG]', p); fetch('http://127.0.0.1:7242/ingest/873cbf59-1a11-4af9-aa21-381ba69693ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).catch(() => { }); };
// #endregion

const AuthStack = createNativeStackNavigator();

type ScreenKey = 'track' | 'sleep-tracker' | 'nutrition-details' | 'food-search' | 'workout' | 'workout-insights' | 'program' | 'program-create' | 'template-create' | 'template-session' | 'my-workouts' | 'workout-history' | 'workout-session-detail' | 'habit-tracker' | 'habit-daily-insights' | 'habit-insights' | 'habit-create' | 'habit-edit' | 'achievements' | 'health-data-test' | 'cart' | 'activity-analytics' | 'onboarding' | 'personal-info' | 'create-post';

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
  // #region agent log
  _appLog('App render', { hypothesisId: 'H2' });
  // #endregion
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenStack, setScreenStack] = useState<ScreenKey[]>(['track']);
  const currentScreen = screenStack[screenStack.length - 1];
  const [habitInsightsHabitId, setHabitInsightsHabitId] = useState<string | null>(null);
  const [habitInsightsDate, setHabitInsightsDate] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [analyticsInitialTab, setAnalyticsInitialTab] = useState<'Steps' | 'Distance' | 'Pace'>('Steps');

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [sessionTemplateId, setSessionTemplateId] = useState<string | null>(null);
  const [sessionProgramId, setSessionProgramId] = useState<string | null>(null);
  const [sessionProgramDayId, setSessionProgramDayId] = useState<string | null>(null);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [trackActiveTab, setTrackActiveTab] = useState<string>('track');

  const navigateTo = useCallback((screen: ScreenKey) => {
    setScreenStack(prev => (prev[prev.length - 1] === screen ? prev : [...prev, screen]));
  }, []);
  const goBack = useCallback(() => {
    setScreenStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);
  const resetToScreen = useCallback((screen: ScreenKey) => {
    setScreenStack([screen]);
  }, []);

  // Nutrition State
  const [foodSearchMealType, setFoodSearchMealType] = useState<any>(null); // Type 'MealType' imported if needed, or just use any/string for now to avoid import loops if types are tricky without proper exports

  // Exercise Search State
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
    navigateTo('template-create');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      _appLog('getSession done', { hasSession: !!session, hypothesisId: 'H3' });
      // #endregion
      setSession(session);
      setLoading(false);
    }).catch(async (err) => {
      // #region agent log
      _appLog('getSession error', { err: String(err), hypothesisId: 'H3' });
      // #endregion
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

  // Debug: Log sessionTemplateId changes
  useEffect(() => {
    console.log('App: sessionTemplateId changed to:', sessionTemplateId);
  }, [sessionTemplateId]);

  if (loading) {
    // #region agent log
    _appLog('App branch: loading', { hypothesisId: 'H4' });
    // #endregion
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: colors.bgMidnight, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryViolet} />
        </View>
      </GestureHandlerRootView>
    )
  }

  if (!session) {
    // #region agent log
    _appLog('App branch: noSession (auth)', { hypothesisId: 'H4' });
    // #endregion
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <NutritionProvider>
            <CartProvider>
              <StatusBar style="light" />
              <NavigationContainer>
                <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
                  <AuthStack.Screen name="SignIn" component={SignInScreen} />
                  <AuthStack.Screen name="SignUp" component={SignUpScreen} />
                </AuthStack.Navigator>
              </NavigationContainer>
            </CartProvider>
          </NutritionProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  }

  // #region agent log
  _appLog('App branch: authenticated', { hypothesisId: 'H4' });
  // #endregion
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <NutritionProvider>
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
                      onNavigateToSleep={() => navigateTo('sleep-tracker')}
                      onNavigateToNutrition={() => navigateTo('nutrition-details')}
                      onNavigateToHabits={() => navigateTo('habit-tracker')}
                      onNavigateToCart={() => navigateTo('cart')}
                      onNavigateToPersonalInfo={() => navigateTo('personal-info')}
                      onNavigateToAchievements={() => navigateTo('achievements')}
                      onNavigateToCreatePost={() => navigateTo('create-post')}
                      onSignOut={() => supabase.auth.signOut()}
                      onNavigateToProgram={() => navigateTo('program')}
                      onNavigateToTemplateCreate={() => handleCreateNewTemplate('track')}
                      onNavigateToMyWorkouts={() => navigateTo('my-workouts')}
                      onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'track')}
                      onNavigateToWorkoutInsights={() => navigateTo('workout-insights')}
                    />
                  ) : currentScreen === 'create-post' ? (
                    <CreatePostScreen navigation={{ goBack }} />
                  ) : currentScreen === 'cart' ? (
                    <CartScreen navigation={{ goBack }} />
                  ) : currentScreen === 'personal-info' ? (
                    <PersonalInfoScreen onClose={goBack} />
                  ) : currentScreen === 'health-data-test' ? (
                    <HealthDataTestScreen navigation={{ goBack }} />
                  ) : currentScreen === 'sleep-tracker' ? (
                    <SleepTrackerScreen navigation={{ goBack }} />
                  ) : currentScreen === 'nutrition-details' ? (
                    <NutritionDetailsScreen
                      navigation={{ goBack }}
                      onNavigateToFoodSearch={(mealType) => {
                        setFoodSearchMealType(mealType);
                        navigateTo('food-search');
                      }}
                    />
                  ) : currentScreen === 'food-search' ? (
                    <FoodSearchScreen
                      onClose={goBack}
                      mealType={foodSearchMealType}
                      onAddFood={async () => {
                        navigateTo('nutrition-details');
                      }}
                    />
                  ) : currentScreen === 'habit-tracker' ? (
                    <HabitTrackerScreen
                      navigation={{ goBack }}
                      onNavigateToHabitInsights={(habitId) => {
                        setHabitInsightsHabitId(habitId);
                        const today = new Date();
                        setHabitInsightsDate(today.toISOString().slice(0, 10));
                        navigateTo('habit-insights');
                      }}
                      onNavigateToCreateHabit={() => navigateTo('habit-create')}
                      onNavigateToEditHabit={(habitId) => { setEditingHabitId(habitId); navigateTo('habit-edit'); }}
                      onNavigateToDailyInsights={() => navigateTo('habit-daily-insights')}
                    />
                  ) : currentScreen === 'habit-daily-insights' ? (
                    <HabitDailyInsightsScreen navigation={{ goBack }} />
                  ) : currentScreen === 'habit-insights' ? (
                    <HabitInsightsScreen
                      navigation={{ goBack: () => { setHabitInsightsHabitId(null); setHabitInsightsDate(null); goBack(); } }}
                      habitId={habitInsightsHabitId}
                      initialDate={habitInsightsDate}
                      onNavigateToEditHabit={(habitId) => { setEditingHabitId(habitId); navigateTo('habit-edit'); }}
                    />
                  ) : currentScreen === 'habit-create' ? (
                    <CreateHabitScreen navigation={{ goBack }} />
                  ) : currentScreen === 'habit-edit' ? (
                    <EditHabitScreen
                      habitId={editingHabitId}
                      navigation={{ goBack: () => { setEditingHabitId(null); goBack(); } }}
                    />
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
                        console.log('App: Starting session from TemplateCreateScreen with editingTemplateId:', editingTemplateId);
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
                  ) : currentScreen === 'my-workouts' ? (
                    <MyWorkoutsScreen
                      navigation={{ goBack }}
                      onNavigateToWorkoutHistory={() => navigateTo('workout-history')}
                      onCreateNew={handleCreateNewTemplate}
                      onStartTemplate={(templateId) => {
                        React.startTransition(() => {
                          setSessionTemplateId(templateId);
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
                  ) : currentScreen === 'template-session' ? (
                    sessionTemplateId ? (
                      <TemplateSessionScreen
                        templateId={sessionTemplateId}
                        workoutProgramId={sessionProgramId ?? undefined}
                        workoutProgramDayId={sessionProgramDayId ?? undefined}
                        navigation={{
                          goBack: () => {
                            setSessionTemplateId(null);
                            setSessionProgramId(null);
                            setSessionProgramDayId(null);
                            goBack();
                          },
                        }}
                        onAddExercise={openExerciseSearch}
                      />
                    ) : (
                      <View style={{ flex: 1, backgroundColor: colors.bgMidnight, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.bodyOrange} />
                        <Text style={{ color: colors.textPrimary, marginTop: 16 }}>Loading session...</Text>
                      </View>
                    )
                  ) : (
                    <WorkoutTrackerScreen
                      navigation={{ goBack }}
                      onNavigateToProgram={() => navigateTo('program')}
                      onNavigateToTemplateCreate={() => handleCreateNewTemplate('workout')}
                      onNavigateToMyWorkouts={() => navigateTo('my-workouts')}
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
          </NutritionProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
