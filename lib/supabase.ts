import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Current values:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[HIDDEN]' : 'undefined')
  console.error('')
  console.error('Please check your .env.local or .env file contains:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]')
  console.error('')
  console.error('Make sure to restart the dev server after adding environment variables!')
  
  // Provide fallback values for development
  throw new Error(
    'Missing Supabase environment variables. Check console for details and restart dev server.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client with service role key
// Only create if service key is available
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
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
