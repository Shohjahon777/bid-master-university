type Optional<T> = T | undefined

const requiredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const requiredSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!requiredSupabaseUrl || !requiredSupabaseAnonKey) {
  const missingVars = [
    !requiredSupabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !requiredSupabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ')

  const baseMessage =
    'Missing Supabase environment variables. Check Vercel Environment Variables and restart the dev server.'

  throw new Error(
    process.env.NODE_ENV === 'production'
      ? `Missing Supabase environment variables in production: ${missingVars}`
      : `${baseMessage} Missing: ${missingVars}`,
  )
}

export const env = {
  supabaseUrl: requiredSupabaseUrl,
  supabaseAnonKey: requiredSupabaseAnonKey,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as Optional<string>,
  resendApiKey: process.env.RESEND_API_KEY as Optional<string>,
  emailFrom: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}

export type Env = typeof env

