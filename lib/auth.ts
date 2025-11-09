import { supabase, supabaseAdmin } from '@/lib/supabase'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { db } from '@/lib/db'
import { User } from '@/types'
import { redirect } from 'next/navigation'

// Types for authentication
export interface AuthUser {
  id: string
  email: string
  name: string
  avatar: string | null
  university: string | null
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SignUpData {
  email: string
  password: string
  name: string
  university?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthError {
  message: string
  code?: string
}

/**
 * Get the current authenticated user from Supabase and fetch from database
 * Returns null if not authenticated or user not found in database
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Use server-side client with cookie support
    const supabaseClient = await getSupabaseServerClient()
    
    // Get user from Supabase Auth
    const { data: { user: supabaseUser }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return null
    }
    
    if (!supabaseUser) {
      return null
    }
    
    // Fetch user from database
    let dbUser = await db.user.findUnique({
      where: { id: supabaseUser.id }
    })
    
    // If user doesn't exist in database but exists in Auth, create them
    if (!dbUser) {
      console.log('User exists in Auth but not in DB, creating user record...', supabaseUser.id)
      
      try {
        // Get user metadata from Supabase Auth
        const userMetadata = supabaseUser.user_metadata || {}
        
        dbUser = await db.user.create({
          data: {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: userMetadata.name || supabaseUser.email?.split('@')[0] || 'User',
            university: userMetadata.university || null,
            verified: supabaseUser.email_confirmed_at ? true : false,
            avatar: userMetadata.avatar || null
          }
        })
        
        console.log('Successfully created user record in database')
      } catch (error) {
        console.error('Error creating user record:', error)
        // If creation fails (e.g., duplicate key), try to fetch again
        dbUser = await db.user.findUnique({
          where: { id: supabaseUser.id }
        })
        
        if (!dbUser) {
          return null
        }
      }
    }
    
    return {
      ...dbUser,
      email: supabaseUser.email!
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Require authentication - throw error if not authenticated
 * Use in Server Actions and protected routes
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized: Please sign in to continue')
  }
  
  return user
}

/**
 * Require admin role - throw error if not admin
 * Use in Admin Server Actions
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required')
  }
  
  return user
}

/**
 * Register a new user with Supabase Auth and create User record in database
 */
export async function signUp({ email, password, name, university }: SignUpData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // 1. Create user in Supabase Auth
    // Try with the original email first
    let { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          university
        }
      }
    })
    
    // If the original email fails and it's a centralasian.uz email, try with a different format
    if (authError && email.includes('@centralasian.uz')) {
      console.log('Retrying with alternative email format...')
      const alternativeEmail = email.replace('@centralasian.uz', '@centralasian.uz.edu')
      
      const retryResult = await supabase.auth.signUp({
        email: alternativeEmail,
        password,
        options: {
          data: {
            name,
            university
          }
        }
      })
      
      if (retryResult.data && !retryResult.error) {
        authData = retryResult.data
        authError = retryResult.error
        console.log('Successfully created user with alternative email format')
      }
    }
    
    if (authError) {
      console.error('Sign up auth error:', authError)
      
      // Handle specific email validation errors
      if (authError.message.includes('Email address') && authError.message.includes('invalid')) {
        return {
          success: false,
          error: 'Email address format is invalid. Please use your university email (e.g., studentID@centralasian.uz)'
        }
      }
      
      return { 
        success: false, 
        error: authError.message || 'Failed to create account' 
      }
    }
    
    if (!authData.user) {
      return { 
        success: false, 
        error: 'Failed to create user account' 
      }
    }
    
    // 2. Create user record in database
    const dbUser = await db.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        name,
        university: university || null,
        verified: false // Will be true after email verification
      }
    })
    
    return {
      success: true,
      user: {
        ...dbUser,
        email: authData.user.email!
      }
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred during sign up' 
    }
  }
}

/**
 * Sign in user with email and password
 */
export async function signIn({ email, password }: SignInData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Sign in error:', error)
      return { 
        success: false, 
        error: error.message || 'Invalid email or password' 
      }
    }
    
    if (!data.user) {
      return { 
        success: false, 
        error: 'Failed to sign in' 
      }
    }
    
    // Fetch user from database
    const dbUser = await db.user.findUnique({
      where: { id: data.user.id }
    })
    
    if (!dbUser) {
      return { 
        success: false, 
        error: 'User account not found' 
      }
    }
    
    return {
      success: true,
      user: {
        ...dbUser,
        email: data.user.email!
      }
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred during sign in' 
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred during sign out' 
    }
  }
}

/**
 * Verify user email with token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    })
    
    if (error) {
      console.error('Email verification error:', error)
      return { 
        success: false, 
        error: error.message || 'Invalid verification token' 
      }
    }
    
    if (!data.user) {
      return { 
        success: false, 
        error: 'Verification failed' 
      }
    }
    
    // Update user as verified in database
    await db.user.update({
      where: { id: data.user.id },
      data: { verified: true }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Email verification error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred during email verification' 
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL}/auth/reset-password`
    })
    
    if (error) {
      console.error('Password reset error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to send reset email' 
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred while sending reset email' 
    }
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error('Password update error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to update password' 
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Password update error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred while updating password' 
    }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  name?: string
  university?: string
  avatar?: string
}): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const user = await requireAuth()
    
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: data.name || user.name,
        university: data.university || user.university,
        avatar: data.avatar || user.avatar
      }
    })
    
    return {
      success: true,
      user: {
        ...updatedUser,
        email: user.email
      }
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile' 
    }
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth()
    
    // Delete user from database first
    await db.user.delete({
      where: { id: user.id }
    })
    
    // Then delete from Supabase Auth (if admin client is available)
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (error) {
        console.error('Account deletion error:', error)
        return { 
          success: false, 
          error: 'Failed to delete account from authentication system' 
        }
      }
    } else {
      console.warn('Supabase admin client not available - user deleted from database only')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Account deletion error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account' 
    }
  }
}

/**
 * Get user by ID (for public profiles)
 */
export async function getUserById(id: string): Promise<Omit<AuthUser, 'email'> | null> {
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        university: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return user
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}
