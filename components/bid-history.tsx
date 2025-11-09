'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { BidWithUser } from '@/types'
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronUp, Trophy, Clock } from 'lucide-react'

interface BidHistoryProps {
  auctionId: string
  initialBids: BidWithUser[]
  currentUserId?: string
  className?: string
}

type SerializedBid = Omit<BidWithUser, 'createdAt' | 'amount'> & {
  amount: number
  createdAt: string
}

export function BidHistory({ auctionId, initialBids, currentUserId, className }: BidHistoryProps) {
  const normalizedInitialBids = useMemo<SerializedBid[]>(() => {
    return initialBids.map((bid) => ({
      ...bid,
      amount: Number(bid.amount),
      createdAt: typeof bid.createdAt === 'string' ? bid.createdAt : bid.createdAt.toISOString()
    }))
  }, [initialBids])

  const [bids, setBids] = useState<SerializedBid[]>(normalizedInitialBids)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setBids(normalizedInitialBids)
  }, [normalizedInitialBids])

  const fetchBids = useCallback(
    async (limit: number) => {
      const response = await fetch(`/api/auctions/${auctionId}/bids?limit=${limit}`, {
        method: 'GET',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bid history')
      }

      const payload = (await response.json()) as { bids?: SerializedBid[] }
      return payload.bids ?? []
    },
    [auctionId]
  )

  // Real-time subscription for new bids
  useEffect(() => {
    const channel = supabase
      .channel(`auction-bids:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auctionId=eq.${auctionId}`
        },
        async (payload) => {
          const inserted = payload.new as { auctionId?: string } | null
          if (inserted?.auctionId !== auctionId) {
            return
          }

          try {
            const latestBids = await fetchBids(1)
            if (latestBids.length === 0) {
              return
            }

            const latestBid = latestBids[0]
            setBids((prev) => {
              const filtered = prev.filter((bid) => bid.id !== latestBid.id)
              return [latestBid, ...filtered]
            })
          } catch (error) {
            console.error('Failed to refresh bid history after realtime update:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auctionId, fetchBids])

  const handleLoadMore = async () => {
    setIsLoading(true)
    try {
      const extendedBids = await fetchBids(20)
      setBids(extendedBids)
      setShowAll(true)
    } catch (error) {
      console.error('Failed to load more bids:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayBids = showAll ? bids : bids.slice(0, 5)
  const hasMoreBids = bids.length > 5 && !showAll

  if (bids.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No bids yet</p>
            <p className="text-sm">Be the first to place a bid!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Bid History
                <Badge variant="outline">
                  {bids.length} bid{bids.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {displayBids.map((bid, index) => {
              const isWinningBid = index === 0
              const isCurrentUserBid = currentUserId === bid.user.id
              
              return (
                <div
                  key={bid.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isWinningBid 
                      ? 'bg-green-50 border-green-200' 
                      : isCurrentUserBid 
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-muted/30'
                  }`}
                >
                  {/* Bidder Avatar */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={bid.user.avatar || undefined} />
                    <AvatarFallback className="text-sm">
                      {getInitials(bid.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Bid Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {bid.user.name}
                      </p>
                      {isWinningBid && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          <Trophy className="w-3 h-3 mr-1" />
                          Winning
                        </Badge>
                      )}
                      {isCurrentUserBid && !isWinningBid && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Your bid
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bid.user.university}
                    </p>
                  </div>

                  {/* Bid Amount and Time */}
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatCurrency(Number(bid.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(bid.createdAt))}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Load More Button */}
            {hasMoreBids && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Show All Bids'}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
