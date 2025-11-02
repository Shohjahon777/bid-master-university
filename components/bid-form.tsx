'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { placeBidSchema, type PlaceBidData } from '@/lib/validations/bid'
import { placeBid, buyNow } from '@/lib/actions/bids'
import { formatCurrency, calculateMinimumBid, calculateBidIncrement } from '@/lib/utils'
import { AuctionWithRelations } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { useBidUpdates } from '@/hooks/use-bid-updates'
import { toast } from 'sonner'
import { Loader2, Gavel, Zap, AlertCircle } from 'lucide-react'

interface BidFormProps {
  auction: AuctionWithRelations
  onBidPlaced?: () => void
  className?: string
}

export function BidForm({ auction, onBidPlaced, className }: BidFormProps) {
  const { user } = useAuth()
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [isOutbidDisabled, setIsOutbidDisabled] = useState(false)

  // Use real-time bid updates
  const { 
    currentPrice: realtimePrice, 
    latestBid, 
    bidCount, 
    isOutbid, 
    isLoading: isRealtimeLoading,
    error: realtimeError 
  } = useBidUpdates(auction.id, user?.id)

  // Use real-time data if available, fallback to initial auction data
  const currentPrice = realtimePrice || Number(auction.currentPrice)
  const startingPrice = Number(auction.startingPrice)
  const buyNowPrice = auction.buyNowPrice ? Number(auction.buyNowPrice) : null
  const minimumBid = calculateMinimumBid(currentPrice)
  const bidIncrement = calculateBidIncrement(currentPrice)

  const isUserSeller = user?.id === auction.userId
  const hasBids = bidCount > 0 || (auction._count?.bids && auction._count.bids > 0)
  const isActive = auction.status === 'ACTIVE' && new Date(auction.endTime) > new Date()

  // Handle outbid state
  useEffect(() => {
    if (isOutbid) {
      setIsOutbidDisabled(true)
      toast.error('You were outbid! Please place a new bid.', {
        duration: 5000
      })
      
      // Re-enable form after 3 seconds
      const timer = setTimeout(() => {
        setIsOutbidDisabled(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isOutbid])

  const form = useForm<PlaceBidData>({
    resolver: zodResolver(placeBidSchema),
    defaultValues: {
      amount: minimumBid,
      auctionId: auction.id
    }
  })

  // Update form when minimum bid changes due to real-time updates
  useEffect(() => {
    form.setValue('amount', minimumBid)
  }, [minimumBid, form])

  const handleQuickBid = (increment: number) => {
    const newAmount = currentPrice + increment
    form.setValue('amount', newAmount)
  }

  const onSubmit = async (data: PlaceBidData) => {
    if (!user) {
      toast.error('Please log in to place a bid')
      return
    }

    if (isUserSeller) {
      toast.error('You cannot bid on your own auction')
      return
    }

    if (!isActive) {
      toast.error('This auction is no longer active')
      return
    }

    if (isOutbidDisabled) {
      toast.error('Please wait a moment before placing a new bid')
      return
    }

    setIsPlacingBid(true)
    try {
      const result = await placeBid(auction.id, data.amount)
      
      if (result.success) {
        // Don't show success toast here as real-time updates will handle it
        form.reset({ amount: calculateMinimumBid(data.amount), auctionId: auction.id })
        onBidPlaced?.()
      } else {
        toast.error(result.error || 'Failed to place bid')
      }
    } catch (error) {
      toast.error('An error occurred while placing your bid')
    } finally {
      setIsPlacingBid(false)
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please log in to buy now')
      return
    }

    if (isUserSeller) {
      toast.error('You cannot buy your own auction')
      return
    }

    if (!isActive) {
      toast.error('This auction is no longer active')
      return
    }

    if (!buyNowPrice) {
      toast.error('Buy now is not available for this auction')
      return
    }

    setIsBuyingNow(true)
    try {
      const result = await buyNow(auction.id)
      
      if (result.success) {
        toast.success(`Congratulations! You won this auction for ${formatCurrency(buyNowPrice)}`)
        onBidPlaced?.()
      } else {
        toast.error(result.error || 'Failed to buy now')
      }
    } catch (error) {
      toast.error('An error occurred while buying now')
    } finally {
      setIsBuyingNow(false)
    }
  }

  if (!isActive) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">
            Auction Ended
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Badge variant="secondary" className="mb-4">
            {auction.winnerId ? 'Sold' : 'Ended'}
          </Badge>
          <p className="text-sm text-muted-foreground">
            This auction is no longer accepting bids.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isUserSeller) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-center">Your Auction</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You cannot bid on your own auction.
          </p>
          <Badge variant="outline">
            {hasBids ? `${auction._count?.bids} bid${auction._count?.bids !== 1 ? 's' : ''}` : 'No bids yet'}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="w-5 h-5" />
          Place a Bid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price Display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {formatCurrency(currentPrice)}
          </div>
          {currentPrice > startingPrice && (
            <div className="text-sm text-muted-foreground">
              Started at <span className="line-through">{formatCurrency(startingPrice)}</span>
            </div>
          )}
        </div>

        {/* Quick Bid Buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Bid</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(bidIncrement)}
              disabled={isPlacingBid || isOutbidDisabled}
            >
              +{formatCurrency(bidIncrement)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(bidIncrement * 2)}
              disabled={isPlacingBid || isOutbidDisabled}
            >
              +{formatCurrency(bidIncrement * 2)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickBid(bidIncrement * 5)}
              disabled={isPlacingBid || isOutbidDisabled}
            >
              +{formatCurrency(bidIncrement * 5)}
            </Button>
          </div>
        </div>

        {/* Custom Bid Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your Bid Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                {...form.register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min={minimumBid}
                className="pl-8"
                placeholder={minimumBid.toString()}
                disabled={isPlacingBid || isOutbidDisabled}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum bid: {formatCurrency(minimumBid)}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPlacingBid || isBuyingNow || isOutbidDisabled}
          >
            {isPlacingBid ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Bid...
              </>
            ) : isOutbidDisabled ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                You were outbid - Please wait
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4 mr-2" />
                Place Bid
              </>
            )}
          </Button>
        </form>

        {/* Buy Now Button */}
        {buyNowPrice && (
          <div className="space-y-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Or buy now for</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(buyNowPrice)}
              </p>
            </div>
            <Button
              onClick={handleBuyNow}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isPlacingBid || isBuyingNow || isOutbidDisabled}
            >
              {isBuyingNow ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Buy Now
                </>
              )}
            </Button>
          </div>
        )}

        {/* Bid Count */}
        {hasBids && (
          <div className="text-center">
            <Badge variant="outline">
              {bidCount || auction._count?.bids} bid{(bidCount || auction._count?.bids) !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Real-time Loading Indicator */}
        {isRealtimeLoading && (
          <div className="text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
            Connecting to real-time updates...
          </div>
        )}

        {/* Real-time Error */}
        {realtimeError && (
          <div className="text-center text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mr-2 inline" />
            {realtimeError}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
