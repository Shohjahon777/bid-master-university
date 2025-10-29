'use client'

import { useState, useCallback } from 'react'
import { uploadAuctionImagesAction, uploadUserAvatarAction } from '@/lib/actions/files'

interface UseFileUploadOptions {
  onSuccess?: (urls: string[]) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadAuctionImages = useCallback(async (
    auctionId: string,
    files: File[]
  ): Promise<{ success: boolean; urls?: string[]; error?: string }> => {
    setIsUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate progress (in real app, you'd track actual upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const result = await uploadAuctionImagesAction(auctionId, files)
      
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.urls) {
        options?.onSuccess?.(result.urls)
        setTimeout(() => setProgress(0), 1000) // Reset progress after success
      } else {
        setError(result.error || 'Upload failed')
        options?.onError?.(result.error || 'Upload failed')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      options?.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [options])

  const uploadUserAvatar = useCallback(async (
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    setIsUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 20
        })
      }, 100)

      const result = await uploadUserAvatarAction(file)
      
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.url) {
        options?.onSuccess?.([result.url])
        setTimeout(() => setProgress(0), 1000)
      } else {
        setError(result.error || 'Upload failed')
        options?.onError?.(result.error || 'Upload failed')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      options?.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setError(null)
    setProgress(0)
    setIsUploading(false)
  }, [])

  return {
    isUploading,
    progress,
    error,
    uploadAuctionImages,
    uploadUserAvatar,
    reset
  }
}
