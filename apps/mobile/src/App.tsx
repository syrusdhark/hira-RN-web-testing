import React, { useState, useEffect } from 'react';
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
  setCurrentScreen,
  currentScreen,
  children,
}: {
  setCurrentScreen: (s: ScreenKey) => void;
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
          setCurrentScreen('track');
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
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('track');
  const [habitInsightsHabitId, setHabitInsightsHabitId] = useState<string | null>(null);
  const [habitInsightsDate, setHabitInsightsDate] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [analyticsInitialTab, setAnalyticsInitialTab] = useState<'Steps' | 'Distance' | 'Pace'>('Steps');

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [sessionTemplateId, setSessionTemplateId] = useState<string | null>(null);
  const [sessionProgramId, setSessionProgramId] = useState<string | null>(null);
  const [sessionProgramDayId, setSessionProgramDayId] = useState<string | null>(null);
  const [templateCreateReturnScreen, setTemplateCreateReturnScreen] = useState<'program' | 'workout' | 'track' | null>(null);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [programReturnScreen, setProgramReturnScreen] = useState<'track' | 'workout'>('workout');
  const [myWorkoutsReturnScreen, setMyWorkoutsReturnScreen] = useState<'track' | 'workout'>('workout');
  const [workoutInsightsReturnScreen, setWorkoutInsightsReturnScreen] = useState<'track' | 'workout'>('workout');

  // Nutrition State
  const [foodSearchMealType, setFoodSearchMealType] = useState<any>(null); // Type 'MealType' imported if needed, or just use any/string for now to avoid import loops if types are tricky without proper exports

  // Exercise Search State
  const [exerciseSearchVisible, setExerciseSearchVisible] = useState(false);
  const [onExerciseSelected, setOnExerciseSelected] = useState<((exercise: any) => void) | undefined>();

  const openExerciseSearch = (callback: (exercise: any) => void) => {
    setOnExerciseSelected(() => callback);
    setExerciseSearchVisible(true);
  };

  const handleEditTemplate = (templateId: string, returnScreen: 'track' | 'workout' = 'workout') => {
    setEditingTemplateId(templateId);
    setTemplateCreateReturnScreen(returnScreen);
    setCurrentScreen('template-create');
  };

  const handleCreateNewTemplate = (returnScreen: 'track' | 'workout' = 'workout') => {
    setEditingTemplateId(null);
    setTemplateCreateReturnScreen(returnScreen);
    setCurrentScreen('template-create');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      _appLog('getSession done', { hasSession: !!session, hypothesisId: 'H3' });
      // #endregion
      setSession(session);
      setLoading(false);
    }).catch((err) => {
      // #region agent log
      _appLog('getSession error', { err: String(err), hypothesisId: 'H3' });
      // #endregion
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
      if (currentScreen === 'cart') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'program-create') {
        setCurrentScreen('program');
        return true;
      }
      if (currentScreen === 'program') {
        setCurrentScreen(programReturnScreen);
        return true;
      }
      if (currentScreen === 'workout') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'workout-insights') {
        setCurrentScreen(workoutInsightsReturnScreen);
        return true;
      }
      if (currentScreen === 'sleep-tracker') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'nutrition-details') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'food-search') {
        setCurrentScreen('nutrition-details');
        return true;
      }
      if (currentScreen === 'habit-tracker') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'habit-daily-insights' || currentScreen === 'habit-insights' || currentScreen === 'habit-create' || currentScreen === 'habit-edit') {
        setCurrentScreen('habit-tracker');
        return true;
      }
      if (currentScreen === 'achievements') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'health-data-test') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'template-create') {
        const returnTo = templateCreateReturnScreen ?? 'workout';
        setEditingTemplateId(null);
        setSessionProgramId(null);
        setSessionProgramDayId(null);
        setTemplateCreateReturnScreen(null);
        setCurrentScreen(returnTo);
        return true;
      }
      if (currentScreen === 'template-session') {
        setSessionTemplateId(null);
        setSessionProgramId(null);
        setSessionProgramDayId(null);
        const returnTo = templateCreateReturnScreen ?? 'workout';
        setTemplateCreateReturnScreen(null);
        setCurrentScreen(returnTo);
        return true;
      }
      if (currentScreen === 'my-workouts') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/873cbf59-1a11-4af9-aa21-381ba69693ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.tsx:hardwareBack', message: 'my-workouts back', data: { willSetScreen: myWorkoutsReturnScreen }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => { });
        // #endregion
        setCurrentScreen(myWorkoutsReturnScreen);
        return true;
      }
      if (currentScreen === 'workout-session-detail') {
        setCurrentScreen('workout-history');
        setWorkoutSessionId(null);
        return true;
      }
      if (currentScreen === 'workout-history') {
        setCurrentScreen('my-workouts');
        return true;
      }
      if (currentScreen === 'activity-analytics') {
        setCurrentScreen('workout');
        return true;
      }
      if (currentScreen === 'personal-info') {
        setCurrentScreen('track');
        return true;
      }
      if (currentScreen === 'create-post') {
        setCurrentScreen('track');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [session, currentScreen, programReturnScreen, myWorkoutsReturnScreen, workoutInsightsReturnScreen, templateCreateReturnScreen]);

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
                <AuthenticatedLayout setCurrentScreen={setCurrentScreen} currentScreen={currentScreen}>
                  <StatusBar style="light" />
                  {currentScreen === 'track' ? (
                    <TrackHomeScreen
                      onNavigateToWorkout={() => setCurrentScreen('workout')}
                      onStartTodayProgramWorkout={(payload) => {
                        React.startTransition(() => {
                          setSessionTemplateId(payload.templateId);
                          setSessionProgramId(payload.programId ?? null);
                          setSessionProgramDayId(payload.programDayId ?? null);
                          setTemplateCreateReturnScreen('track');
                          setCurrentScreen('template-session');
                        });
                      }}
                      onNavigateToSleep={() => setCurrentScreen('sleep-tracker')}
                      onNavigateToNutrition={() => setCurrentScreen('nutrition-details')}
                      onNavigateToHabits={() => setCurrentScreen('habit-tracker')}
                      onNavigateToCart={() => setCurrentScreen('cart')}
                      onNavigateToPersonalInfo={() => setCurrentScreen('personal-info')}
                      onNavigateToAchievements={() => setCurrentScreen('achievements')}
                      onNavigateToCreatePost={() => setCurrentScreen('create-post')}
                      onSignOut={() => supabase.auth.signOut()}
                      onNavigateToProgram={() => {
                        setProgramReturnScreen('track');
                        setCurrentScreen('program');
                      }}
                      onNavigateToTemplateCreate={() => handleCreateNewTemplate('track')}
                      onNavigateToMyWorkouts={() => {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/873cbf59-1a11-4af9-aa21-381ba69693ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.tsx:onNavigateToMyWorkouts', message: 'navigate to my-workouts', data: { from: 'track' }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => { });
                        // #endregion
                        setMyWorkoutsReturnScreen('track');
                        setCurrentScreen('my-workouts');
                      }}
                      onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'track')}
                      onNavigateToWorkoutInsights={() => {
                        setWorkoutInsightsReturnScreen('track');
                        setCurrentScreen('workout-insights');
                      }}
                    />
                  ) : currentScreen === 'create-post' ? (
                    <CreatePostScreen navigation={{ goBack: () => setCurrentScreen('track') }} />
                  ) : currentScreen === 'cart' ? (
                    <CartScreen navigation={{ goBack: () => setCurrentScreen('track') }} />
                  ) : currentScreen === 'personal-info' ? (
                    <PersonalInfoScreen onClose={() => setCurrentScreen('track')} />
                  ) : currentScreen === 'health-data-test' ? (
                    <HealthDataTestScreen navigation={{ goBack: () => setCurrentScreen('track') }} />
                  ) : currentScreen === 'sleep-tracker' ? (
                    <SleepTrackerScreen navigation={{ goBack: () => setCurrentScreen('track') }} />
                  ) : currentScreen === 'nutrition-details' ? (
                    <NutritionDetailsScreen
                      navigation={{ goBack: () => setCurrentScreen('track') }}
                      onNavigateToFoodSearch={(mealType) => {
                        setFoodSearchMealType(mealType);
                        setCurrentScreen('food-search');
                      }}
                    />
                  ) : currentScreen === 'food-search' ? (
                    <FoodSearchScreen
                      onClose={() => setCurrentScreen('nutrition-details')}
                      mealType={foodSearchMealType}
                      onAddFood={async (food) => {
                        // We'll handle the add inside the screen or here?
                        // The screen itself can use context since it's inside provider.
                        // So we just close it here or handle 'success' toast?
                        // Actually FoodSearchScreen doesn't existing in context yet effectively? 
                        // No, it is inside NutritionProvider.
                        // Let's pass a dummy callback if the screen handles it, or handle it here if we want App to orchestrate.
                        // But App doesn't use nutrition hook.
                        // So let the screen handle it.
                        setCurrentScreen('nutrition-details');
                      }}
                    />
                  ) : currentScreen === 'habit-tracker' ? (
                    <HabitTrackerScreen
                      navigation={{ goBack: () => setCurrentScreen('track') }}
                      onNavigateToHabitInsights={(habitId) => {
                        setHabitInsightsHabitId(habitId);
                        const today = new Date();
                        setHabitInsightsDate(today.toISOString().slice(0, 10));
                        setCurrentScreen('habit-insights');
                      }}
                      onNavigateToCreateHabit={() => setCurrentScreen('habit-create')}
                      onNavigateToEditHabit={(habitId) => { setEditingHabitId(habitId); setCurrentScreen('habit-edit'); }}
                      onNavigateToDailyInsights={() => setCurrentScreen('habit-daily-insights')}
                    />
                  ) : currentScreen === 'habit-daily-insights' ? (
                    <HabitDailyInsightsScreen navigation={{ goBack: () => setCurrentScreen('habit-tracker') }} />
                  ) : currentScreen === 'habit-insights' ? (
                    <HabitInsightsScreen
                      navigation={{ goBack: () => { setCurrentScreen('habit-tracker'); setHabitInsightsHabitId(null); setHabitInsightsDate(null); } }}
                      habitId={habitInsightsHabitId}
                      initialDate={habitInsightsDate}
                      onNavigateToEditHabit={(habitId) => { setEditingHabitId(habitId); setCurrentScreen('habit-edit'); }}
                    />
                  ) : currentScreen === 'habit-create' ? (
                    <CreateHabitScreen navigation={{ goBack: () => setCurrentScreen('habit-tracker') }} />
                  ) : currentScreen === 'habit-edit' ? (
                    <EditHabitScreen
                      habitId={editingHabitId}
                      navigation={{ goBack: () => { setEditingHabitId(null); setCurrentScreen('habit-tracker'); } }}
                    />
                  ) : currentScreen === 'achievements' ? (
                    <AchievementsScreen navigation={{ goBack: () => setCurrentScreen('track') }} />
                  ) : currentScreen === 'workout-insights' ? (
                    <WorkoutInsightsScreen navigation={{ goBack: () => setCurrentScreen(workoutInsightsReturnScreen) }} />
                  ) : currentScreen === 'workout' ? (
                    <WorkoutTrackerScreen
                      navigation={{ goBack: () => setCurrentScreen('track') }}
                      onNavigateToProgram={() => {
                        setProgramReturnScreen('workout');
                        setCurrentScreen('program');
                      }}
                      onNavigateToTemplateCreate={() => handleCreateNewTemplate('workout')}
                      onNavigateToMyWorkouts={() => {
                        setMyWorkoutsReturnScreen('workout');
                        setCurrentScreen('my-workouts');
                      }}
                      onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'workout')}
                      onNavigateToWorkoutInsights={() => {
                        setWorkoutInsightsReturnScreen('workout');
                        setCurrentScreen('workout-insights');
                      }}
                    />
                  ) : currentScreen === 'onboarding' ? (
                    <OnboardingScreen onComplete={() => setCurrentScreen('track')} />
                  ) : currentScreen === 'activity-analytics' ? (
                    <ActivityAnalyticsScreen
                      initialTab={analyticsInitialTab}
                      navigation={{ goBack: () => setCurrentScreen('workout') }}
                    />
                  ) : currentScreen === 'program-create' ? (
                    <CreateProgramScreen
                      navigation={{ goBack: () => setCurrentScreen('program') }}
                      onSuccess={() => setCurrentScreen('program')}
                    />
                  ) : currentScreen === 'program' ? (
                    <ProgramScreen
                      navigation={{ goBack: () => setCurrentScreen(programReturnScreen) }}
                      onViewProgramDay={(payload) => {
                        React.startTransition(() => {
                          setEditingTemplateId(payload.templateId);
                          setSessionProgramId(payload.programId ?? null);
                          setSessionProgramDayId(payload.programDayId ?? null);
                          setTemplateCreateReturnScreen('program');
                          setCurrentScreen('template-create');
                        });
                      }}
                      onStartProgramDay={(payload) => {
                        React.startTransition(() => {
                          setSessionTemplateId(payload.templateId);
                          setSessionProgramId(payload.programId ?? null);
                          setSessionProgramDayId(payload.programDayId ?? null);
                          setCurrentScreen('template-session');
                        });
                      }}
                      onCreateProgram={() => setCurrentScreen('program-create')}
                    />
                  ) : currentScreen === 'template-create' ? (
                    <TemplateCreateScreen
                      navigation={{
                        goBack: () => {
                          const returnTo = templateCreateReturnScreen ?? 'workout';
                          setEditingTemplateId(null);
                          setSessionProgramId(null);
                          setSessionProgramDayId(null);
                          setTemplateCreateReturnScreen(null);
                          setCurrentScreen(returnTo);
                        }
                      }}
                      onStartSession={() => {
                        console.log('App: Starting session from TemplateCreateScreen with editingTemplateId:', editingTemplateId);
                        if (editingTemplateId) {
                          React.startTransition(() => {
                            setSessionTemplateId(editingTemplateId);
                            setCurrentScreen('template-session');
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
                      navigation={{
                        goBack: () => {
                          // #region agent log
                          fetch('http://127.0.0.1:7242/ingest/873cbf59-1a11-4af9-aa21-381ba69693ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'App.tsx:MyWorkoutsScreen.goBack', message: 'MyWorkoutsScreen goBack', data: { willSetScreen: myWorkoutsReturnScreen }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => { });
                          // #endregion
                          setCurrentScreen(myWorkoutsReturnScreen);
                        },
                      }}
                      onNavigateToWorkoutHistory={() => setCurrentScreen('workout-history')}
                      onCreateNew={handleCreateNewTemplate}
                      onStartTemplate={(templateId) => {
                        React.startTransition(() => {
                          setSessionTemplateId(templateId);
                          setCurrentScreen('template-session');
                        });
                      }}
                      onEditTemplate={handleEditTemplate}
                    />
                  ) : currentScreen === 'workout-history' ? (
                    <WorkoutHistoryScreen
                      navigation={{ goBack: () => setCurrentScreen('my-workouts') }}
                      onSessionPress={(sessionId) => {
                        setWorkoutSessionId(sessionId);
                        setCurrentScreen('workout-session-detail');
                      }}
                    />
                  ) : currentScreen === 'workout-session-detail' ? (
                    <WorkoutSessionDetailScreen
                      sessionId={workoutSessionId}
                      navigation={{ goBack: () => { setCurrentScreen('workout-history'); setWorkoutSessionId(null); } }}
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
                            const returnTo = templateCreateReturnScreen ?? 'workout';
                            setTemplateCreateReturnScreen(null);
                            setCurrentScreen(returnTo);
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
                      navigation={{ goBack: () => setCurrentScreen('track') }}
                      onNavigateToProgram={() => {
                        setProgramReturnScreen('workout');
                        setCurrentScreen('program');
                      }}
                      onNavigateToTemplateCreate={() => handleCreateNewTemplate('workout')}
                      onNavigateToMyWorkouts={() => {
                        setMyWorkoutsReturnScreen('workout');
                        setCurrentScreen('my-workouts');
                      }}
                      onEditTemplate={(templateId: string) => handleEditTemplate(templateId, 'workout')}
                      onNavigateToWorkoutInsights={() => {
                        setWorkoutInsightsReturnScreen('workout');
                        setCurrentScreen('workout-insights');
                      }}
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
