'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { BidWithUser } from '@/types'
import { toast } from 'sonner'

interface BidUpdateData {
  currentPrice: number
  latestBid: BidWithUser | null
  bidCount: number
  isOutbid: boolean
}

interface UseBidUpdatesReturn {
  currentPrice: number
  latestBid: BidWithUser | null
  bidCount: number
  isOutbid: boolean
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

  // Fetch initial auction data
  const fetchAuctionData = useCallback(async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch auction data')
      }
      
      const auction = await response.json()
      setData({
        currentPrice: Number(auction.currentPrice),
        latestBid: auction.bids?.[0] || null,
        bidCount: auction.bidCount || 0,
        isOutbid: false
      })
    } catch (err) {
      console.error('Error fetching auction data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch auction data')
    } finally {
      setIsLoading(false)
    }
  }, [auctionId])

  // Handle new bid updates
  const handleBidUpdate = useCallback((payload: any) => {
    const newBid = payload.new as BidWithUser
    
    setData(prevData => {
      const newPrice = Number(newBid.amount)
      const wasUserOutbid = Boolean(currentUserId && 
        prevData.latestBid?.userId === currentUserId && 
        newBid.userId !== currentUserId)
      
      // Show toast for new bids
      if (newBid.userId !== currentUserId) {
        toast.success(`New bid placed! Current price: $${newPrice.toFixed(2)}`)
      }
      
      return {
        currentPrice: newPrice,
        latestBid: newBid,
        bidCount: prevData.bidCount + 1,
        isOutbid: wasUserOutbid
      }
    })
  }, [currentUserId])

  // Set up real-time subscription
  useEffect(() => {
    if (!auctionId) return

    // Fetch initial data
    fetchAuctionData()

    // Set up real-time subscription
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
        handleBidUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to bid updates for auction:', auctionId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to bid updates')
          setError('Failed to connect to real-time updates')
        }
      })

    // Cleanup subscription on unmount
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
