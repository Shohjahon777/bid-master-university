'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { AuctionStatus } from '@prisma/client'
import { isAuctionActive } from '@/lib/utils'
import { 
  createAuctionSchema, 
  calculateEndTime,
  type CreateAuctionData 
} from '@/lib/validations/auction'

// Get auctions with filters
export async function getAuctions(params: {
  search?: string
  category?: string
  condition?: string
  minPrice?: number
  maxPrice?: number
  endingSoon?: boolean
  buyNowOnly?: boolean
  sortBy?: 'newest' | 'ending' | 'price_low' | 'price_high'
  page?: number
  limit?: number
}) {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      endingSoon,
      buyNowOnly,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = params

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: AuctionStatus.ACTIVE
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Category filter
    if (category && category !== 'all') {
      where.category = category
    }

    // Condition filter
    if (condition && condition !== 'all') {
      where.condition = condition
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.currentPrice = {}
      if (minPrice !== undefined) {
        where.currentPrice.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.currentPrice.lte = maxPrice
      }
    }

    // Ending soon filter (next 24 hours)
    if (endingSoon) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      where.endTime = {
        lte: tomorrow
      }
    }

    // Buy now available filter
    if (buyNowOnly) {
      where.buyNowPrice = {
        not: null
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' } // default

    switch (sortBy) {
      case 'ending':
        orderBy = { endTime: 'asc' }
        break
      case 'price_low':
        orderBy = { currentPrice: 'asc' }
        break
      case 'price_high':
        orderBy = { currentPrice: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Get auctions
    const [auctions, total] = await Promise.all([
      db.auction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
        }
      }),
      db.auction.count({ where })
    ])

    return {
      auctions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error fetching auctions:', error)
    throw new Error('Failed to fetch auctions')
  }
}

// Create auction
export async function createAuction(formData: FormData) {
  try {
    const user = await requireAuth()

    // Parse form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      condition: formData.get('condition') as string,
      startingPrice: Number(formData.get('startingPrice')),
      buyNowPrice: formData.get('buyNowPrice') ? Number(formData.get('buyNowPrice')) : undefined,
      duration: formData.get('duration') as string,
      images: formData.get('images') ? JSON.parse(formData.get('images') as string) : []
    }

    // Validate data
    const validatedData = createAuctionSchema.parse(rawData)

    // Calculate end time from duration
    const endTime = calculateEndTime(validatedData.duration)

    // Create auction
    const auction = await db.auction.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        condition: validatedData.condition,
        startingPrice: validatedData.startingPrice,
        currentPrice: validatedData.startingPrice,
        buyNowPrice: validatedData.buyNowPrice,
        images: validatedData.images,
        startTime: new Date(),
        endTime: endTime,
        userId: user.id
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
        }
      }
    })

    revalidatePath('/auctions')
    return { success: true, auction }
  } catch (error) {
    console.error('Error creating auction:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create auction' }
  }
}

// Get auction by ID
export async function getAuctionById(id: string) {
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
          take: 10,
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

    if (!auction) {
      return null
    }

    return auction
  } catch (error) {
    console.error('Error fetching auction:', error)
    return null
  }
}

// Get categories for filters
export async function getCategories() {
  try {
    const categories = await db.auction.groupBy({
      by: ['category'],
      where: {
        status: AuctionStatus.ACTIVE
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    return categories.map(cat => ({
      value: cat.category,
      label: cat.category,
      count: cat._count.category
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Get conditions for filters
export async function getConditions() {
  try {
    const conditions = await db.auction.groupBy({
      by: ['condition'],
      where: {
        status: AuctionStatus.ACTIVE
      },
      _count: {
        condition: true
      },
      orderBy: {
        _count: {
          condition: 'desc'
        }
      }
    })

    return conditions.map(cond => ({
      value: cond.condition,
      label: cond.condition,
      count: cond._count.condition
    }))
  } catch (error) {
    console.error('Error fetching conditions:', error)
    return []
  }
}
