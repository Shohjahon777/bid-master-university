import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { env } from '@/lib/config/env'

export const getSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }))
      },
      async setAll(cookiesToSet) {
        const mutableCookies = await cookies()
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            mutableCookies.set({
              name,
              value,
              ...(options ?? {}),
            })
          } catch (error) {
            console.warn('Could not set cookie:', error)
          }
        })
      },
    },
  })
})

// Backwards-compatible helper used across server actions
export async function createClient() {
  return getSupabaseServerClient()
}
