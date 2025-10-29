'use server'

import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { redirect } from 'next/navigation'

// Zod validation schema for login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  rememberMe: z.boolean()
})

type LoginFormData = z.infer<typeof loginSchema>

export async function loginUser(formData: FormData) {
  try {
    // Parse form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      rememberMe: formData.get('rememberMe') === 'on'
    }

    // Validate form data
    const validatedData = loginSchema.parse(rawData)

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    })

    if (error) {
      console.error('Login error:', error)
      
      // Handle specific error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.'
        }
      }
      
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please check your email and click the confirmation link before signing in.'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to sign in. Please try again.'
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Failed to sign in. Please try again.'
      }
    }

    return {
      success: true,
      user: data.user,
      message: 'Successfully signed in!'
    }
  } catch (error) {
    console.error('Login error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}
