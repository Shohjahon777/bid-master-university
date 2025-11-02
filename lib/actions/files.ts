'use server'

import { requireAuth } from '@/lib/auth'
import { uploadAuctionImages, uploadUserAvatar, deleteFile } from '@/lib/storage'
import { STORAGE_BUCKETS } from '@/lib/storage'

/**
 * Upload auction images
 */
export async function uploadAuctionImagesAction(
  auctionId: string,
  files: File[]
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    // Verify user is authenticated
    await requireAuth()

    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided' }
    }

    // Upload images
    const result = await uploadAuctionImages(files, auctionId)
    return result
  } catch (error) {
    console.error('Error uploading auction images:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatarAction(
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Verify user is authenticated
    const user = await requireAuth()

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Upload avatar
    const result = await uploadUserAvatar(file, user.id)
    
    // If upload successful, update user record with avatar URL
    if (result.success && result.url) {
      const { updateAvatar } = await import('@/lib/actions/user')
      await updateAvatar(result.url)
    }
    
    return result
  } catch (error) {
    console.error('Error uploading user avatar:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Delete auction images
 */
export async function deleteAuctionImagesAction(
  auctionId: string,
  imageUrls: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user is authenticated
    await requireAuth()

    if (!imageUrls || imageUrls.length === 0) {
      return { success: true }
    }

    // Extract file paths from URLs
    const filePaths = imageUrls.map(url => {
      // Extract path from Supabase storage URL
      const urlParts = url.split('/storage/v1/object/public/')
      if (urlParts.length === 2) {
        const pathParts = urlParts[1].split('/')
        return pathParts.slice(1).join('/') // Remove bucket name
      }
      return null
    }).filter(Boolean) as string[]

    if (filePaths.length === 0) {
      return { success: false, error: 'Invalid image URLs' }
    }

    // Delete files
    const deletePromises = filePaths.map(path => 
      deleteFile(STORAGE_BUCKETS.AUCTION_IMAGES, path)
    )

    const results = await Promise.all(deletePromises)
    const failed = results.filter(result => !result.success)

    if (failed.length > 0) {
      return { 
        success: false, 
        error: `Failed to delete ${failed.length} files` 
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting auction images:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }
  }
}

/**
 * Delete user avatar
 */
export async function deleteUserAvatarAction(
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user is authenticated
    await requireAuth()

    if (!avatarUrl) {
      return { success: true }
    }

    // Extract file path from URL
    const urlParts = avatarUrl.split('/storage/v1/object/public/')
    if (urlParts.length !== 2) {
      return { success: false, error: 'Invalid avatar URL' }
    }

    const pathParts = urlParts[1].split('/')
    const filePath = pathParts.slice(1).join('/') // Remove bucket name

    // Delete file
    const result = await deleteFile(STORAGE_BUCKETS.USER_AVATARS, filePath)
    return result
  } catch (error) {
    console.error('Error deleting user avatar:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }
  }
}
