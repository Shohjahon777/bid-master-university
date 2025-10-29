// Example usage of authentication functions
// This file shows how to use the auth helpers in different scenarios

import { 
  getCurrentUser, 
  requireAuth, 
  signUp, 
  signIn, 
  signOut, 
  verifyEmail,
  updateProfile,
  sendPasswordReset
} from './auth'

// Example 1: Server Action with authentication
export async function createAuctionAction(formData: FormData) {
  'use server'
  
  try {
    // Require authentication - throws error if not authenticated
    const user = await requireAuth()
    
    // Now you can safely use user.id, user.name, etc.
    console.log('Creating auction for user:', user.name)
    
    // Your auction creation logic here...
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication required' 
    }
  }
}

// Example 2: Client-side sign up
export async function handleSignUp(email: string, password: string, name: string) {
  const result = await signUp({ email, password, name })
  
  if (result.success) {
    console.log('User created:', result.user?.name)
    // Redirect to dashboard or show success message
  } else {
    console.error('Sign up failed:', result.error)
    // Show error message to user
  }
  
  return result
}

// Example 3: Client-side sign in
export async function handleSignIn(email: string, password: string) {
  const result = await signIn({ email, password })
  
  if (result.success) {
    console.log('User signed in:', result.user?.name)
    // Redirect to dashboard
  } else {
    console.error('Sign in failed:', result.error)
    // Show error message
  }
  
  return result
}

// Example 4: Check authentication status
export async function checkAuthStatus() {
  const user = await getCurrentUser()
  
  if (user) {
    console.log('User is authenticated:', user.name)
    return { isAuthenticated: true, user }
  } else {
    console.log('User is not authenticated')
    return { isAuthenticated: false, user: null }
  }
}

// Example 5: Update user profile
export async function handleUpdateProfile(name: string, university: string) {
  const result = await updateProfile({ name, university })
  
  if (result.success) {
    console.log('Profile updated:', result.user?.name)
  } else {
    console.error('Profile update failed:', result.error)
  }
  
  return result
}

// Example 6: Password reset
export async function handlePasswordReset(email: string) {
  const result = await sendPasswordReset(email)
  
  if (result.success) {
    console.log('Password reset email sent')
  } else {
    console.error('Password reset failed:', result.error)
  }
  
  return result
}

// Example 7: Sign out
export async function handleSignOut() {
  const result = await signOut()
  
  if (result.success) {
    console.log('User signed out')
    // Redirect to home page
  } else {
    console.error('Sign out failed:', result.error)
  }
  
  return result
}
