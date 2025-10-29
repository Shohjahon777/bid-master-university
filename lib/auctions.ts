import { db } from '@/lib/db'
import { AuctionWithRelations } from '@/types'
import { AuctionStatus } from '@prisma/client'

export async function getRecentAuctions(limit: number = 6): Promise<AuctionWithRelations[]> {
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

    return auctions
  } catch (error) {
    console.error('Error fetching recent auctions:', error)
    return []
  }
}

export async function getAuctionById(id: string): Promise<AuctionWithRelations | null> {
  try {
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

    return auction
  } catch (error) {
    console.error('Error fetching auction by ID:', error)
    return null
  }
}
