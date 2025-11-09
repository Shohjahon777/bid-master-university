import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/config/env'

export const supabase = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)

// Server-side Supabase client with service role key
// Only create if service key is available
export const supabaseAdmin = env.supabaseServiceRoleKey
  ? createSupabaseClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}
