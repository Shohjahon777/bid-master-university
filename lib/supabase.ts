import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ Missing Supabase environment variables!'
  console.error(errorMsg)
  console.error('Current values:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[HIDDEN]' : 'undefined')
  console.error('')
  console.error('For production (Vercel), set these in: Settings > Environment Variables')
  console.error('For development, check your .env.local file contains:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]')
  console.error('')
  
  // In production, throw a more helpful error
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing Supabase environment variables in production. Check Vercel Environment Variables.'
    )
  }
  
  throw new Error(
    'Missing Supabase environment variables. Check console for details and restart dev server.'
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key
// Only create if service key is available
export const supabaseAdmin = supabaseServiceKey 
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}
