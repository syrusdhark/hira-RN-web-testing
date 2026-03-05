
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { debugLog } from './debug-log'

// #region agent log
const _log = (msg: string, data: Record<string, unknown>) => { const p = { location: 'supabase.ts:init', message: msg, data, timestamp: Date.now(), hypothesisId: 'H1' }; console.log('[DEBUG]', p); };
// #endregion

const supabaseUrl = 'https://crobxiicimgjmacsqfkg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2J4aWljaW1nam1hY3NxZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Njk1NzksImV4cCI6MjA4NTI0NTU3OX0.cOd1APBnwhxHcqwWMQKyVccuzOR58dWpM89uBRp3uLc'

// #region agent log
debugLog({ location: 'supabase.ts:init', message: 'supabase url configured', data: { supabaseUrl, hasKey: !!supabaseAnonKey }, hypothesisId: 'H3' });
// #endregion

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})
// #region agent log
_log('supabase client created', {});
// #endregion