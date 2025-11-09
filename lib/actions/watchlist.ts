'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { AuctionStatus } from '@prisma/client'
import { getTimeRemaining, isAuctionActive, isAuctionEnded } from '@/lib/utils'
import { AUCTIONS_LIST_TAG, AUCTIONS_RECENT_TAG, getAuctionDetailTag } from '@/lib/auctions'

export interface WatchlistItem {
  id: string
  auctionId: string
  createdAt: string
  auction: {
    id: string
    title: string
    images: string[]
    currentPrice: number
    startingPrice: number
    buyNowPrice: number | null
    status: AuctionStatus
    endTime: string
    _count: {
      bids: number
    }
    user: {
      id: string
      name: string
      avatar: string | null
      verified: boolean
    }
  }
}

// Add auction to watchlist
export async function addToWatchlist(auctionId: string) {
  try {
    const user = await requireAuth()

    // Check if auction exists
    const auction = await db.auction.findUnique({
      where: { id: auctionId }
    })

    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }

    // Check if already in watchlist
    const existing = await db.watchlist.findUnique({
      where: {
        userId_auctionId: {
          userId: user.id,
          auctionId
        }
      }
    })

    if (existing) {
      return { success: false, error: 'Auction already in watchlist' }
    }

    // Add to watchlist
    await db.watchlist.create({
      data: {
        userId: user.id,
        auctionId
      }
    })

    revalidatePath('/dashboard/watchlist')
    revalidateTag(getAuctionDetailTag(auctionId), 'default')
    revalidateTag(AUCTIONS_LIST_TAG, 'default')
    revalidateTag(AUCTIONS_RECENT_TAG, 'default')

    return { success: true }
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return { success: false, error: 'Failed to add to watchlist' }
  }
}

// Remove auction from watchlist
export async function removeFromWatchlist(auctionId: string) {
  try {
    const user = await requireAuth()

    // Remove from watchlist
    await db.watchlist.deleteMany({
      where: {
        userId: user.id,
        auctionId
      }
    })

    revalidatePath('/dashboard/watchlist')
    revalidateTag(getAuctionDetailTag(auctionId), 'default')
    revalidateTag(AUCTIONS_LIST_TAG, 'default')
    revalidateTag(AUCTIONS_RECENT_TAG, 'default')

    return { success: true }
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return { success: false, error: 'Failed to remove from watchlist' }
  }
}

// Get user's watchlist
export async function getUserWatchlist() {
  try {
    const user = await requireAuth()

    const watchlistItems = await db.watchlist.findMany({
      where: {
        userId: user.id
      },
      include: {
        auction: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                verified: true
              }
            },
            _count: {
              select: {
                bids: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return watchlistItems.map((item) => ({
      id: item.id,
      auctionId: item.auctionId,
      createdAt: item.createdAt.toISOString(),
      auction: {
        id: item.auction.id,
        title: item.auction.title,
        images: item.auction.images,
        currentPrice: Number(item.auction.currentPrice),
        startingPrice: Number(item.auction.startingPrice),
        buyNowPrice: item.auction.buyNowPrice ? Number(item.auction.buyNowPrice) : null,
        status: item.auction.status,
        endTime: item.auction.endTime.toISOString(),
        _count: {
          bids: item.auction._count.bids
        },
        user: item.auction.user
      }
    }))
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return []
  }
}

// Check if auction is in watchlist
export async function isInWatchlist(auctionId: string) {
  try {
    const user = await requireAuth()

    const item = await db.watchlist.findUnique({
      where: {
        userId_auctionId: {
          userId: user.id,
          auctionId
        }
      }
    })

    return !!item
  } catch (error) {
    return false
  }
}

