
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// #region agent log
const _log = (msg: string, data: Record<string, unknown>) => { const p = { location: 'supabase.ts:init', message: msg, data, timestamp: Date.now(), hypothesisId: 'H1' }; console.log('[DEBUG]', p); fetch('http://127.0.0.1:7242/ingest/873cbf59-1a11-4af9-aa21-381ba69693ce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }).catch(() => {}); };
// #endregion

const supabaseUrl = 'https://crobxiicimgjmacsqfkg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2J4aWljaW1nam1hY3NxZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Njk1NzksImV4cCI6MjA4NTI0NTU3OX0.cOd1APBnwhxHcqwWMQKyVccuzOR58dWpM89uBRp3uLc'

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