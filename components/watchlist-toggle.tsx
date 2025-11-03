'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist'

interface WatchlistToggleProps {
  auctionId: string
  isInWatchlist: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function WatchlistToggle({ 
  auctionId, 
  isInWatchlist: initialIsInWatchlist,
  variant = 'outline',
  size = 'sm',
  className 
}: WatchlistToggleProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      const result = isInWatchlist 
        ? await removeFromWatchlist(auctionId)
        : await addToWatchlist(auctionId)
      
      if (result.success) {
        setIsInWatchlist(!isInWatchlist)
        toast.success(
          isInWatchlist 
            ? 'Removed from watchlist' 
            : 'Added to watchlist'
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
      disabled={isLoading}
    >
      <Heart 
        className={`w-4 h-4 mr-2 ${isInWatchlist ? 'fill-red-500 text-red-500' : ''}`}
      />
      {isInWatchlist ? 'Watching' : 'Watch'}
    </Button>
  )
}

