import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Clears all app storage and signs out. Use for "Clear app data" / "Clear website data" in Profile.
 * After this, the user will need to sign in again. On iOS PWA, for a full cache reset (e.g. after
 * viewport/zoom fixes), the user should also: remove app from Home Screen → Safari Settings →
 * Clear Website Data for this site → add to Home Screen again.
 */
export async function clearAppStorageAndSignOut(): Promise<void> {
  await supabase.auth.signOut();
  await AsyncStorage.clear();

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  }
}

/** Message to show after clearing, with iOS PWA instructions. */
export const CLEAR_DATA_IOS_PWA_INSTRUCTIONS =
  'App data cleared. You will need to sign in again.\n\n' +
  'On iOS PWA, for a full reset (e.g. fix zoom/cache): remove the app from Home Screen → Safari → Settings → Clear Website Data for this site → add to Home Screen again.';
