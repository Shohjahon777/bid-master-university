'use server'

import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Zod validation schema for registration
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email) => {
      const domain = email.split('@')[1]?.toLowerCase()
      if (!domain) return false
      
      // Check for Central Asian University specifically
      if (domain === 'centralasian.uz' || domain === 'uz.edu') {
        return true
      }
      
      // Check for other university domains
      const validDomains = [
        'edu',
        'ac.uk',
        'edu.au',
        'ac.in',
        'edu.sg',
        'ac.za',
        'edu.tr',
        'ac.jp',
        'edu.br',
        'ac.ca'
      ]
      return validDomains.some(uniDomain => domain?.endsWith(uniDomain))
    }, 'Please use your university email address (e.g., studentID@centralasian.uz)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  university: z
    .string()
    .min(1, 'Please select your university')
})

type RegisterFormData = z.infer<typeof registerSchema>

export async function registerUser(formData: FormData) {
  try {
    // Parse form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      university: formData.get('university') as string
    }

    // Validate form data
    const validatedData = registerSchema.parse(rawData)

    // Validate email domain before attempting signup
    const domain = validatedData.email.split('@')[1]?.toLowerCase()
    const validDomains = [
      'centralasian.uz',
      'uz.edu',
      'edu',
      'ac.uk',
      'edu.au',
      'ac.in',
      'edu.sg',
      'ac.za',
      'edu.tr',
      'ac.jp',
      'edu.br',
      'ac.ca'
    ]
    
    const isValidDomain = domain && (
      domain === 'centralasian.uz' || 
      domain === 'uz.edu' ||
      validDomains.some(validDomain => domain.endsWith('.' + validDomain))
    )
    
    if (!isValidDomain) {
      return {
        success: false,
        error: 'Please use a valid university email address (e.g., studentID@centralasian.uz)'
      }
    }

    // 1. Create user in Supabase Auth
    // Try with the original email first
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    let { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${baseUrl}/verify-email`,
        data: {
          name: validatedData.name,
          university: validatedData.university
        }
      }
    })
    
    // If the original email fails and it's a centralasian.uz email, try with a different format
    if (authError && validatedData.email.includes('@centralasian.uz')) {
      console.log('Retrying with alternative email format...')
      const alternativeEmail = validatedData.email.replace('@centralasian.uz', '@centralasian.uz.edu')
      
      const retryResult = await supabase.auth.signUp({
        email: alternativeEmail,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${baseUrl}/verify-email`,
          data: {
            name: validatedData.name,
            university: validatedData.university
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
        name: validatedData.name,
        university: validatedData.university,
        verified: false, // Will be true after email confirmation
        avatar: null
      }
    })

    // 3. Revalidate relevant paths
    revalidatePath('/')

    return { 
      success: true, 
      user: dbUser,
      message: 'Account created successfully! Please check your email to verify your account.' 
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message
      }
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        success: false,
        error: 'An account with this email already exists. Please try signing in instead.'
      }
    }

    return { 
      success: false, 
      error: 'Failed to create account. Please try again.' 
    }
  }
}
