/**
 * Query optimization utilities
 * Provides optimized query builders and helpers
 */

import { Prisma } from '@prisma/client'

/**
 * Standard auction select fields for list views
 * Minimizes data transfer by selecting only needed fields
 */
export const auctionListSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  condition: true,
  images: true,
  startingPrice: true,
  currentPrice: true,
  buyNowPrice: true,
  startTime: true,
  endTime: true,
  status: true,
  createdAt: true,
  userId: true,
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
      university: true,
      verified: true
    }
  },
  _count: {
    select: {
      bids: true
    }
  }
} satisfies Prisma.AuctionSelect

/**
 * Optimized auction detail select
 * Includes more fields needed for detail view
 */
export const auctionDetailSelect = {
  ...auctionListSelect,
  description: true,
  bids: {
    select: {
      id: true,
      amount: true,
      userId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          university: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc' as const
    },
    take: 10
  }
} satisfies Prisma.AuctionSelect

/**
 * Build optimized where clause for auction queries
 * Uses indexes effectively
 */
export function buildAuctionWhereClause(params: {
  search?: string
  category?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  endingSoon?: boolean
  buyNowOnly?: boolean
  newListings?: boolean
  status?: 'ACTIVE' | 'ENDED' | 'CANCELLED'
}): Prisma.AuctionWhereInput {
  const where: Prisma.AuctionWhereInput = {
    status: params.status || 'ACTIVE'
  }

  // Search - uses full-text search if available, falls back to contains
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } }
    ]
  }

  // Category filter (uses index)
  if (params.category && params.category !== 'all') {
    if (params.category.includes(',')) {
      const categories = params.category.split(',').filter(c => c.trim() !== '')
      if (categories.length > 0) {
        where.category = { in: categories }
      }
    } else {
      where.category = params.category
    }
  }

  // Condition filter
  if (params.condition && params.condition !== 'all') {
    where.condition = params.condition
  }

  // Price range (uses index on currentPrice)
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.currentPrice = {}
    if (params.minPrice !== undefined) {
      where.currentPrice.gte = params.minPrice
    }
    if (params.maxPrice !== undefined) {
      where.currentPrice.lte = params.maxPrice
    }
  }

  // Ending soon (uses composite index on status + endTime)
  if (params.endingSoon) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    where.endTime = {
      lte: tomorrow
    }
  }

  // Buy now available
  if (params.buyNowOnly) {
    where.buyNowPrice = {
      not: null
    }
  }

  // New listings (uses index on createdAt)
  if (params.newListings) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    where.createdAt = {
      gte: weekAgo
    }
  }

  return where
}

/**
 * Build optimized orderBy clause
 * Ensures queries use indexes effectively
 */
export function buildAuctionOrderBy(
  sortBy: 'newest' | 'ending' | 'price_low' | 'price_high'
): Prisma.AuctionOrderByWithRelationInput {
  switch (sortBy) {
    case 'ending':
      return { endTime: 'asc' } // Uses endTime index
    case 'price_low':
      return { currentPrice: 'asc' } // Uses currentPrice index
    case 'price_high':
      return { currentPrice: 'desc' } // Uses currentPrice index
    case 'newest':
    default:
      return { createdAt: 'desc' } // Uses createdAt index
  }
}

