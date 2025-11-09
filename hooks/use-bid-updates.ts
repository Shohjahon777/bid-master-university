'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { BidWithUser } from '@/types'
import { toast } from 'sonner'

type SerializedBidWithUser = Omit<BidWithUser, 'createdAt' | 'amount'> & {
  amount: number
  createdAt: string
}

interface BidSnapshot {
  currentPrice: number
  latestBid: SerializedBidWithUser | null
  bidCount: number
}

interface BidUpdateData extends BidSnapshot {
  isOutbid: boolean
}

interface UseBidUpdatesReturn extends BidUpdateData {
  isLoading: boolean
  error: string | null
}

export function useBidUpdates(auctionId: string, currentUserId?: string): UseBidUpdatesReturn {
  const [data, setData] = useState<BidUpdateData>({
    currentPrice: 0,
    latestBid: null,
    bidCount: 0,
    isOutbid: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previousBidRef = useRef<SerializedBidWithUser | null>(null)

  const fetchSnapshot = useCallback(async (): Promise<BidSnapshot | null> => {
    const response = await fetch(`/api/auctions/${auctionId}`, {
      method: 'GET',
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch auction data')
    }

    const auction = await response.json()

    const latestBid = auction.bids?.[0]
      ? ({
          ...auction.bids[0],
          amount: Number(auction.bids[0].amount),
          createdAt:
            typeof auction.bids[0].createdAt === 'string'
              ? auction.bids[0].createdAt
              : new Date(auction.bids[0].createdAt).toISOString()
        } as SerializedBidWithUser)
      : null

    return {
      currentPrice: Number(auction.currentPrice),
      latestBid,
      bidCount: auction.bidCount ?? (Array.isArray(auction.bids) ? auction.bids.length : 0)
    }
  }, [auctionId])

  const applySnapshot = useCallback(
    (snapshot: BidSnapshot, options: { fromRealtime?: boolean } = {}) => {
      const { fromRealtime = false } = options
      const previousBid = previousBidRef.current
      const latestBid = snapshot.latestBid

      const wasUserOutbid = Boolean(
        fromRealtime &&
          currentUserId &&
          previousBid &&
          previousBid.userId === currentUserId &&
          latestBid &&
          latestBid.userId !== currentUserId
      )

      setData({
        currentPrice: snapshot.currentPrice,
        latestBid,
        bidCount: snapshot.bidCount,
        isOutbid: wasUserOutbid
      })

      if (
        fromRealtime &&
        latestBid &&
        latestBid.userId !== currentUserId &&
        latestBid.id !== previousBid?.id
      ) {
        toast.success(`New bid placed! Current price: $${snapshot.currentPrice.toFixed(2)}`)
      }

      previousBidRef.current = latestBid
      setError(null)
    },
    [currentUserId]
  )

  const fetchAuctionData = useCallback(async () => {
    try {
      const snapshot = await fetchSnapshot()
      if (!snapshot) return
      applySnapshot(snapshot)
    } catch (err) {
      console.error('Error fetching auction data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch auction data')
    } finally {
      setIsLoading(false)
    }
  }, [applySnapshot, fetchSnapshot])

  const handleBidUpdate = useCallback(async () => {
    try {
      const snapshot = await fetchSnapshot()
      if (!snapshot) return
      applySnapshot(snapshot, { fromRealtime: true })
    } catch (err) {
      console.error('Error handling bid update:', err)
      setError('Failed to process real-time update')
    }
  }, [applySnapshot, fetchSnapshot])

  useEffect(() => {
    if (!auctionId) {
      return
    }

    fetchAuctionData()

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
        (payload) => {
          const inserted = payload.new as { auctionId?: string } | null
          if (inserted?.auctionId === auctionId) {
            void handleBidUpdate()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to bid updates for auction:', auctionId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to bid updates')
          setError('Failed to connect to real-time updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auctionId, fetchAuctionData, handleBidUpdate])

  return {
    currentPrice: data.currentPrice,
    latestBid: data.latestBid,
    bidCount: data.bidCount,
    isOutbid: data.isOutbid,
    isLoading,
    error
  }
}
