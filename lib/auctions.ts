import { db } from '@/lib/db'
import { AuctionWithRelations } from '@/types'
import { AuctionStatus } from '@prisma/client'

export async function getRecentAuctions(limit: number = 6): Promise<any[]> {
  try {
    const auctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            university: true,
            verified: true
          }
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
                university: true
              }
            }
          }
        },
        _count: {
          select: {
            bids: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Serialize Decimal and Date fields for client components
    return auctions.map(auction => ({
      ...auction,
      startingPrice: Number(auction.startingPrice),
      currentPrice: Number(auction.currentPrice),
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      bids: auction.bids.map(bid => ({
        ...bid,
        amount: Number(bid.amount),
        createdAt: bid.createdAt.toISOString()
      }))
    }))
  } catch (error) {
    console.error('Error fetching recent auctions:', error)
    return []
  }
}

export async function getAuctionById(id: string): Promise<any | null> {
  try {
    // Check and end auction if expired (on-demand check for better UX with daily cron limitation)
    const { checkAndEndAuction } = await import('@/lib/scheduler')
    await checkAndEndAuction(id).catch((error) => {
      console.error('Error checking auction expiration:', error)
      // Continue with fetching auction even if check fails
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
            verified: true
          }
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                university: true
              }
            }
          }
        },
        _count: {
          select: {
            bids: true
          }
        }
      }
    })

    if (!auction) return null

    // Serialize Decimal and Date fields for client components
    return {
      ...auction,
      startingPrice: Number(auction.startingPrice),
      currentPrice: Number(auction.currentPrice),
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      bids: auction.bids.map(bid => ({
        ...bid,
        amount: Number(bid.amount),
        createdAt: bid.createdAt.toISOString()
      }))
    }
  } catch (error) {
    console.error('Error fetching auction by ID:', error)
    return null
  }
}
