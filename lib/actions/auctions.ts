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
  newListings?: boolean
  sortBy?: 'newest' | 'ending' | 'price_low' | 'price_high'
  page?: number
  limit?: number
}) {
  try {
    console.log('🔍 getAuctions called with params:', JSON.stringify(params, null, 2))
    
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      endingSoon,
      buyNowOnly,
      newListings,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = params

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: AuctionStatus.ACTIVE
    }
    
    console.log('📊 Database query where clause:', JSON.stringify(where, null, 2))

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Category filter (supports single category or comma-separated multiple categories)
    if (category && category !== 'all') {
      // Check if it's comma-separated (multiple categories)
      if (category.includes(',')) {
        const categories = category.split(',').filter(c => c.trim() !== '')
        if (categories.length > 0) {
          where.category = { in: categories }
        }
      } else {
        where.category = category
      }
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

    // New listings filter (created within last 7 days)
    if (newListings) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      where.createdAt = {
        gte: weekAgo
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
    console.log('🔌 Attempting database connection...')
    
    // Test database connection first
    try {
      await db.$connect()
      console.log('✅ Database connected successfully')
    } catch (connectError) {
      console.error('❌ Database connection failed:', connectError)
      throw connectError
    }
    
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
    
    console.log(`✅ Found ${total} total auctions, returning ${auctions.length} auctions`)

    // Serialize Decimal and Date fields
    const serializedAuctions = auctions.map(auction => ({
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
      })),
      _count: {
        bids: auction._count?.bids || 0
      }
    }))

    return {
      auctions: serializedAuctions,
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
    console.error('❌ Error fetching auctions:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check if it's a database connection error
    if (error instanceof Error && (
      error.message.includes('connect') || 
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout')
    )) {
      console.error('❌ DATABASE CONNECTION ERROR - Check your DATABASE_URL environment variable')
    }
    
    // Return empty result instead of throwing to prevent page crashes
    return {
      auctions: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 12,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
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

    // Serialize Decimal fields to numbers (keep Date objects as-is for server-side use)
    return {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      category: auction.category,
      condition: auction.condition,
      images: auction.images,
      startingPrice: Number(auction.startingPrice),
      currentPrice: Number(auction.currentPrice),
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      startTime: auction.startTime,
      endTime: auction.endTime,
      status: auction.status,
      winnerId: auction.winnerId,
      userId: auction.userId,
      createdAt: auction.createdAt,
      updatedAt: auction.updatedAt,
      user: auction.user,
      bids: auction.bids.map(bid => ({
        id: bid.id,
        amount: Number(bid.amount),
        userId: bid.userId,
        auctionId: bid.auctionId,
        createdAt: bid.createdAt,
        user: bid.user
      })),
      _count: {
        bids: auction._count?.bids || 0
      }
    }
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

    // Category label mapping
    const categoryLabels: Record<string, string> = {
      ELECTRONICS: 'Electronics',
      CLOTHING: 'Clothing',
      BOOKS: 'Books',
      FURNITURE: 'Furniture',
      SPORTS: 'Sports',
      JEWELRY: 'Jewelry',
      ART: 'Art',
      COLLECTIBLES: 'Collectibles',
      VEHICLES: 'Vehicles',
      OTHER: 'Other'
    }

    return categories.map(cat => ({
      value: cat.category,
      label: categoryLabels[cat.category] || cat.category,
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

// Update auction
export async function updateAuction(formData: FormData) {
  try {
    const user = await requireAuth()
    
    const auctionId = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const startingPrice = Number(formData.get('startingPrice'))
    const buyNowPrice = formData.get('buyNowPrice') ? Number(formData.get('buyNowPrice')) : undefined
    const duration = formData.get('duration') as string
    
    // Validate input
    const validatedData = {
      id: auctionId,
      title,
      description,
      startingPrice,
      buyNowPrice,
      duration
    }
    
    // Check if auction exists and belongs to user
    const auction = await db.auction.findUnique({
      where: { id: auctionId }
    })
    
    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }
    
    if (auction.userId !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    if (auction.status !== AuctionStatus.ACTIVE) {
      return { success: false, error: 'Only active auctions can be updated' }
    }
    
    // Calculate new end time if duration changed
    const endTime = duration ? 
      new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000) :
      auction.endTime
    
    // Update auction
    const updatedAuction = await db.auction.update({
      where: { id: auctionId },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startingPrice: validatedData.startingPrice,
        buyNowPrice: validatedData.buyNowPrice,
        endTime
      }
    })
    
    revalidatePath('/dashboard/auctions')
    revalidatePath(`/auctions/${auctionId}`)
    
    return { 
      success: true, 
      auction: {
        ...updatedAuction,
        startingPrice: Number(updatedAuction.startingPrice),
        currentPrice: Number(updatedAuction.currentPrice),
        buyNowPrice: updatedAuction.buyNowPrice ? Number(updatedAuction.buyNowPrice) : null,
        createdAt: updatedAuction.createdAt.toISOString(),
        updatedAt: updatedAuction.updatedAt.toISOString(),
        startTime: updatedAuction.startTime.toISOString(),
        endTime: updatedAuction.endTime.toISOString()
      },
      message: 'Auction updated successfully!' 
    }
  } catch (error) {
    console.error('Error updating auction:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { 
      success: false, 
      error: 'Failed to update auction. Please try again.',
      details: errorMessage
    }
  }
}
