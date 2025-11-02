'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  university: z.string().max(100, 'University name must be less than 100 characters').optional().nullable(),
})

// Update user profile
export async function updateProfile(formData: FormData) {
  try {
    const user = await requireAuth()

    // Parse form data
    const data = {
      name: formData.get('name') as string,
      university: formData.get('university') as string | null,
    }

    // Validate
    const validatedData = updateProfileSchema.parse(data)

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: validatedData.name,
        university: validatedData.university || null,
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation error' }
    }
    
    return { success: false, error: 'Failed to update profile' }
  }
}

// Update user avatar URL (called after successful upload)
export async function updateAvatar(avatarUrl: string) {
  try {
    const user = await requireAuth()

    // Update avatar
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating avatar:', error)
    return { success: false, error: 'Failed to update avatar' }
  }
}

// Change password
export async function changePassword(formData: FormData) {
  try {
    const user = await requireAuth()
    
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: 'All password fields are required' }
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match' }
    }

    // Note: Password changes are handled by Supabase Auth
    // This would typically call supabase.auth.updateUser({ password: newPassword })
    // For MVP, we'll return a message that this feature needs Supabase Auth integration
    
    return { success: false, error: 'Password change requires Supabase Auth integration. Please use Supabase dashboard for now.' }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Failed to change password' }
  }
}

