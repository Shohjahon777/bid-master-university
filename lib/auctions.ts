import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { AuctionStatus } from '@prisma/client'
import { AuctionWithRelations, BidWithUser } from '@/types'

export const AUCTIONS_LIST_TAG = 'auctions:list'
export const AUCTIONS_RECENT_TAG = 'auctions:recent'
const AUCTION_DETAIL_TAG_PREFIX = 'auction:'

export const getAuctionDetailTag = (id: string) =>
  `${AUCTION_DETAIL_TAG_PREFIX}${id}`

type SerializableBid = Omit<BidWithUser, 'amount' | 'createdAt'> & {
  amount: number
  createdAt: string
}

export type SerializableAuction = Omit<
  AuctionWithRelations,
  | 'startingPrice'
  | 'currentPrice'
  | 'buyNowPrice'
  | 'createdAt'
  | 'updatedAt'
  | 'startTime'
  | 'endTime'
  | 'bids'
> & {
  startingPrice: number
  currentPrice: number
  buyNowPrice: number | null
  createdAt: string
  updatedAt: string
  startTime: string
  endTime: string
  bids: SerializableBid[]
}

async function fetchRecentAuctions(limit: number = 6): Promise<SerializableAuction[]> {
  try {
    const auctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            university: true,
            verified: true,
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                university: true,
              },
            },
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return auctions.map<SerializableAuction>((auction) => ({
      ...auction,
      startingPrice: Number(auction.startingPrice),
      currentPrice: Number(auction.currentPrice),
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      bids: auction.bids.map<SerializableBid>((bid) => ({
        ...bid,
        amount: Number(bid.amount),
        createdAt: bid.createdAt.toISOString(),
      })),
    }))
  } catch (error) {
    console.error('Error fetching recent auctions:', error)
    return []
  }
}

async function fetchAuctionById(id: string): Promise<SerializableAuction | null> {
  try {
    const { checkAndEndAuction } = await import('@/lib/scheduler')
    await checkAndEndAuction(id).catch((error) => {
      console.error('Error checking auction expiration:', error)
    })

    const auction = await db.auction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            university: true,
            verified: true,
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                university: true,
              },
            },
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    })

    if (!auction) return null

    return {
      ...auction,
      startingPrice: Number(auction.startingPrice),
      currentPrice: Number(auction.currentPrice),
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      bids: auction.bids.map<SerializableBid>((bid) => ({
        ...bid,
        amount: Number(bid.amount),
        createdAt: bid.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error('Error fetching auction by ID:', error)
    return null
  }
}

const getRecentAuctionsCached = unstable_cache(
  (limit: number = 6) => fetchRecentAuctions(limit),
  ['auctions:recent'],
  {
    tags: [AUCTIONS_LIST_TAG, AUCTIONS_RECENT_TAG],
    revalidate: 120,
  },
)

export const getRecentAuctions = (limit: number = 6): Promise<SerializableAuction[]> =>
  getRecentAuctionsCached(limit)

export const getAuctionById = async (id: string): Promise<SerializableAuction | null> =>
  unstable_cache(
    () => fetchAuctionById(id),
    ['auctions:detail', id],
    {
      tags: [AUCTIONS_LIST_TAG, getAuctionDetailTag(id)],
      revalidate: 30,
    },
  )()
