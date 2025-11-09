'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist'

interface WatchlistToggleProps {
  auctionId: string
  initialIsInWatchlist?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function WatchlistToggle({
  auctionId,
  initialIsInWatchlist,
  variant = 'outline',
  size = 'sm',
  className,
}: WatchlistToggleProps) {
  const hasInitial = initialIsInWatchlist !== undefined
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist ?? false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingStatus, setIsFetchingStatus] = useState(!hasInitial)

  useEffect(() => {
    if (hasInitial) {
      setIsFetchingStatus(false)
      return
    }

    let isMounted = true

    const loadWatchlistStatus = async () => {
      setIsFetchingStatus(true)
      try {
        const response = await fetch(`/api/watchlist/${auctionId}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (isMounted && typeof data.isInWatchlist === 'boolean') {
          setIsInWatchlist(data.isInWatchlist)
        }
      } catch (error) {
        console.error('Error fetching watchlist status:', error)
      } finally {
        if (isMounted) {
          setIsFetchingStatus(false)
        }
      }
    }

    loadWatchlistStatus()

    return () => {
      isMounted = false
    }
  }, [auctionId, hasInitial])

  const handleToggle = async () => {
    if (isLoading || isFetchingStatus) {
      return
    }

    setIsLoading(true)

    try {
      const result = isInWatchlist
        ? await removeFromWatchlist(auctionId)
        : await addToWatchlist(auctionId)

      if (result.success) {
        setIsInWatchlist((prev) => !prev)
        toast.success(
          isInWatchlist ? 'Removed from watchlist' : 'Added to watchlist',
        )
      } else {
        toast.error(result.error || 'Failed to update watchlist')
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      toast.error('Failed to update watchlist')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleToggle}
      disabled={isLoading || isFetchingStatus}
    >
      <Heart
        className={`w-4 h-4 mr-2 ${isInWatchlist ? 'fill-red-500 text-red-500' : ''}`}
      />
      {isInWatchlist ? 'Watching' : 'Watch'}
    </Button>
  )
}

