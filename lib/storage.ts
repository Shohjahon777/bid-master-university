import { supabase } from '@/lib/supabase'

// Storage bucket names
export const STORAGE_BUCKETS = {
  AUCTION_IMAGES: 'auction-images',
  USER_AVATARS: 'user-avatars',
  DOCUMENTS: 'documents'
} as const

// Allowed file types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
] as const

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  AVATAR: 2 * 1024 * 1024, // 2MB
  DOCUMENT: 10 * 1024 * 1024 // 10MB
} as const

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    upsert?: boolean
    contentType?: string
  }
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file type and size
    const validation = validateFile(file, bucket)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options?.upsert || false,
        contentType: options?.contentType || file.type
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Upload multiple files (for auction images)
 */
export async function uploadMultipleFiles(
  bucket: string,
  files: File[],
  basePath: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  try {
    const uploadPromises = files.map((file, index) => {
      const fileName = `${Date.now()}-${index}-${file.name}`
      const path = `${basePath}/${fileName}`
      return uploadFile(bucket, path, file)
    })

    const results = await Promise.all(uploadPromises)
    const failed = results.filter(result => !result.success)
    
    if (failed.length > 0) {
      return { 
        success: false, 
        error: `Failed to upload ${failed.length} files` 
      }
    }

    const urls = results
      .filter(result => result.success)
      .map(result => result.url!)
    
    return { success: true, urls }
  } catch (error) {
    console.error('Multiple upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  } catch (error) {
    console.error('Signed URL error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create signed URL' 
    }
  }
}

/**
 * Validate file before upload
 */
function validateFile(file: File, bucket: string): { valid: boolean; error?: string } {
  // Check file size
  let maxSize: number
  switch (bucket) {
    case STORAGE_BUCKETS.AUCTION_IMAGES:
      maxSize = FILE_SIZE_LIMITS.IMAGE
      break
    case STORAGE_BUCKETS.USER_AVATARS:
      maxSize = FILE_SIZE_LIMITS.AVATAR
      break
    case STORAGE_BUCKETS.DOCUMENTS:
      maxSize = FILE_SIZE_LIMITS.DOCUMENT
      break
    default:
      maxSize = FILE_SIZE_LIMITS.IMAGE
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { 
      valid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    }
  }

  // Check file type
  let allowedTypes: readonly string[]
  switch (bucket) {
    case STORAGE_BUCKETS.AUCTION_IMAGES:
    case STORAGE_BUCKETS.USER_AVATARS:
      allowedTypes = ALLOWED_IMAGE_TYPES
      break
    case STORAGE_BUCKETS.DOCUMENTS:
      allowedTypes = ALLOWED_DOCUMENT_TYPES
      break
    default:
      allowedTypes = ALLOWED_IMAGE_TYPES
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} is not allowed` 
    }
  }

  return { valid: true }
}

/**
 * Generate optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  }
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  if (!options) {
    return data.publicUrl
  }

  // Add transformation parameters
  const params = new URLSearchParams()
  
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())
  if (options.format) params.set('format', options.format)

  const queryString = params.toString()
  return queryString ? `${data.publicUrl}?${queryString}` : data.publicUrl
}

/**
 * Upload auction images with optimization
 */
export async function uploadAuctionImages(
  files: File[],
  auctionId: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  const basePath = `auctions/${auctionId}`
  return uploadMultipleFiles(STORAGE_BUCKETS.AUCTION_IMAGES, files, basePath)
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`
  const path = `avatars/${fileName}`
  return uploadFile(STORAGE_BUCKETS.USER_AVATARS, path, file, { upsert: true })
}
