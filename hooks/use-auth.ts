"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthUser } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()
        if (supabaseUser) {
          // In a real app, you'd fetch the full user profile from your database
          // For now, we'll create a mock user object
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || 'User',
            avatar: supabaseUser.user_metadata?.avatar_url || null,
            university: supabaseUser.user_metadata?.university || null,
            verified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
      } else if (session?.user) {
        getUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
