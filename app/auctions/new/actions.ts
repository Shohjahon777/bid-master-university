'use server'

import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { 
  createAuctionSchema, 
  calculateEndTime,
  type CreateAuctionData 
} from '@/lib/validations/auction'
import { AuctionStatus } from '@prisma/client'
import { AUCTIONS_LIST_TAG, AUCTIONS_RECENT_TAG } from '@/lib/auctions'

export async function createAuction(formData: FormData) {
  try {
    // 1. Get current user
    const user = await requireAuth()

    // 2. Parse and validate form data
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

    // 3. Validate with Zod schema
    const validatedData = createAuctionSchema.parse(rawData)

    // 4. Calculate end time from duration
    const endTime = calculateEndTime(validatedData.duration)

    // 5. Create auction in database
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
        status: AuctionStatus.ACTIVE,
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

    // 6. Revalidate cached auctions data
    revalidateTag(AUCTIONS_LIST_TAG, 'default')
    revalidateTag(AUCTIONS_RECENT_TAG, 'default')

    // 7. Return success with serialized auction
    return { 
      success: true, 
      auction: {
        ...auction,
        startingPrice: Number(auction.startingPrice),
        currentPrice: Number(auction.currentPrice),
        buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
        createdAt: auction.createdAt.toISOString(),
        updatedAt: auction.updatedAt.toISOString(),
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString()
      },
      message: 'Auction created successfully!' 
    }
  } catch (error) {
    console.error('Error creating auction:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return { 
        success: false, 
        error: 'Please check your form data and try again.',
        details: error.message
      }
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { 
        success: false, 
        error: 'An auction with this title already exists. Please choose a different title.',
        details: error.message
      }
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { 
      success: false, 
      error: 'Failed to create auction. Please try again.',
      details: errorMessage
    }
  }
}

// Helper function to validate auction timing
export async function validateAuctionTiming(startTime: Date, endTime: Date): Promise<boolean> {
  const now = new Date()
  return startTime >= now && endTime > startTime
}

// Helper function to check if user can create auction
export async function canUserCreateAuction(): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const user = await requireAuth()
    
    // Check if user is verified (optional business rule)
    if (!user.verified) {
      return { 
        allowed: false, 
        reason: 'Please verify your email address before creating auctions.' 
      }
    }

    // Check if user has reached auction limit (optional business rule)
    const activeAuctions = await db.auction.count({
      where: {
        userId: user.id,
        status: AuctionStatus.ACTIVE
      }
    })

    const maxAuctions = 10 // Configurable limit
    if (activeAuctions >= maxAuctions) {
      return { 
        allowed: false, 
        reason: `You can only have ${maxAuctions} active auctions at a time.` 
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking user permissions:', error)
    return { 
      allowed: false, 
      reason: 'Unable to verify permissions. Please try again.' 
    }
  }
}
