import { z } from 'zod'
import { AuctionCategory } from '@/types'

// Auction category enum for validation
const AuctionCategoryEnum = z.nativeEnum(AuctionCategory, {
  message: 'Please select a valid category'
})

// Condition enum
const ConditionEnum = z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor'], {
  message: 'Please select a valid condition'
})

// Duration enum (in days)
const DurationEnum = z.enum(['1', '3', '7', '14'], {
  message: 'Please select a valid duration'
})

// Main auction creation schema
export const createAuctionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      'Title cannot be empty'
    ),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .refine(
      (val) => val.length > 0,
      'Description cannot be empty'
    ),
  
  category: AuctionCategoryEnum,
  
  condition: ConditionEnum,
  
  images: z
    .array(z.string().url('Invalid image URL'))
    .min(1, 'At least 1 image is required')
    .max(5, 'Maximum 5 images allowed')
    .refine(
      (urls) => {
        // Check for duplicate URLs
        const uniqueUrls = new Set(urls)
        return uniqueUrls.size === urls.length
      },
      'Duplicate images are not allowed'
    ),
  
  startingPrice: z
    .number()
    .positive('Starting price must be positive')
    .min(1, 'Starting price must be at least $1')
    .max(999999.99, 'Starting price cannot exceed $999,999.99')
    .refine(
      (val) => Number.isFinite(val) && val > 0,
      'Starting price must be a valid positive number'
    ),
  
  buyNowPrice: z
    .number()
    .positive('Buy now price must be positive')
    .min(1, 'Buy now price must be at least $1')
    .max(999999.99, 'Buy now price cannot exceed $999,999.99')
    .optional()
    .refine(
      (val) => val === undefined || Number.isFinite(val),
      'Buy now price must be a valid number'
    ),
  
  duration: DurationEnum
}).refine(
  (data) => {
    // Buy now price must be greater than starting price
    if (data.buyNowPrice && data.buyNowPrice <= data.startingPrice) {
      return false
    }
    return true
  },
  {
    message: 'Buy now price must be greater than starting price',
    path: ['buyNowPrice']
  }
)

// Schema for updating an auction (all fields optional except validation rules)
export const updateAuctionSchema = createAuctionSchema.partial().extend({
  id: z.string().min(1, 'Auction ID is required')
})

// Schema for auction search/filtering
export const auctionSearchSchema = z.object({
  query: z.string().optional(),
  category: AuctionCategoryEnum.optional(),
  condition: ConditionEnum.optional(),
  minPrice: z
    .number()
    .min(0, 'Minimum price cannot be negative')
    .optional(),
  maxPrice: z
    .number()
    .min(0, 'Maximum price cannot be negative')
    .optional(),
  endingSoon: z.boolean().optional(),
  buyNowOnly: z.boolean().optional(),
  sortBy: z.enum(['newest', 'ending', 'price_low', 'price_high']).optional(),
  page: z.number().int().min(1, 'Page must be at least 1').optional(),
  limit: z.number().int().min(1).max(50, 'Limit cannot exceed 50').optional()
}).refine(
  (data) => {
    // Max price must be greater than min price
    if (data.minPrice && data.maxPrice && data.maxPrice <= data.minPrice) {
      return false
    }
    return true
  },
  {
    message: 'Maximum price must be greater than minimum price',
    path: ['maxPrice']
  }
)

// Schema for bid creation
export const createBidSchema = z.object({
  auctionId: z.string().min(1, 'Auction ID is required'),
  amount: z
    .number()
    .positive('Bid amount must be positive')
    .min(0.01, 'Bid amount must be at least $0.01')
    .max(999999.99, 'Bid amount cannot exceed $999,999.99')
    .refine(
      (val) => Number.isFinite(val),
      'Bid amount must be a valid number'
    )
})

// Schema for auction status update
export const updateAuctionStatusSchema = z.object({
  id: z.string().min(1, 'Auction ID is required'),
  status: z.enum(['ACTIVE', 'ENDED', 'CANCELLED'], {
    message: 'Invalid auction status'
  })
})

// Schema for auction deletion
export const deleteAuctionSchema = z.object({
  id: z.string().min(1, 'Auction ID is required')
})

// Helper function to calculate end time from duration
export function calculateEndTime(duration: string): Date {
  const days = parseInt(duration)
  const endTime = new Date()
  endTime.setDate(endTime.getDate() + days)
  return endTime
}

// Helper function to validate auction timing
export function validateAuctionTiming(startTime: Date, endTime: Date): boolean {
  const now = new Date()
  return startTime >= now && endTime > startTime
}

// Helper function to get duration in days from start and end times
export function getDurationInDays(startTime: Date, endTime: Date): number {
  const diffTime = endTime.getTime() - startTime.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Validation helper for image URLs
export function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const validDomains = [
      'supabase.co',
      'supabase.com',
      'amazonaws.com',
      'cloudinary.com',
      'imgur.com'
    ]
    
    return validDomains.some(domain => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
}

// Enhanced image validation schema
export const imageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .refine(validateImageUrl, 'Image must be hosted on a trusted domain')

// Enhanced images array schema with domain validation
export const imagesArraySchema = z
  .array(imageUrlSchema)
  .min(1, 'At least 1 image is required')
  .max(5, 'Maximum 5 images allowed')
  .refine(
    (urls) => {
      const uniqueUrls = new Set(urls)
      return uniqueUrls.size === urls.length
    },
    'Duplicate images are not allowed'
  )

// Export TypeScript types
export type CreateAuctionData = z.infer<typeof createAuctionSchema>
export type UpdateAuctionData = z.infer<typeof updateAuctionSchema>
export type AuctionSearchData = z.infer<typeof auctionSearchSchema>
export type CreateBidData = z.infer<typeof createBidSchema>
export type UpdateAuctionStatusData = z.infer<typeof updateAuctionStatusSchema>
export type DeleteAuctionData = z.infer<typeof deleteAuctionSchema>

// Export individual field schemas for reuse
export const titleSchema = createAuctionSchema.shape.title
export const descriptionSchema = createAuctionSchema.shape.description
export const categorySchema = createAuctionSchema.shape.category
export const conditionSchema = createAuctionSchema.shape.condition
export const imagesSchema = imagesArraySchema
export const startingPriceSchema = createAuctionSchema.shape.startingPrice
export const buyNowPriceSchema = createAuctionSchema.shape.buyNowPrice
export const durationSchema = createAuctionSchema.shape.duration

// Validation error messages
export const VALIDATION_MESSAGES = {
  TITLE: {
    MIN_LENGTH: 'Title must be at least 3 characters',
    MAX_LENGTH: 'Title must be less than 100 characters',
    REQUIRED: 'Title is required',
    EMPTY: 'Title cannot be empty'
  },
  DESCRIPTION: {
    MIN_LENGTH: 'Description must be at least 10 characters',
    MAX_LENGTH: 'Description must be less than 1000 characters',
    REQUIRED: 'Description is required',
    EMPTY: 'Description cannot be empty'
  },
  CATEGORY: {
    REQUIRED: 'Please select a category',
    INVALID: 'Please select a valid category'
  },
  CONDITION: {
    REQUIRED: 'Please select a condition',
    INVALID: 'Please select a valid condition'
  },
  IMAGES: {
    REQUIRED: 'At least 1 image is required',
    MAX_COUNT: 'Maximum 5 images allowed',
    INVALID_URL: 'Invalid image URL',
    DUPLICATE: 'Duplicate images are not allowed',
    INVALID_DOMAIN: 'Image must be hosted on a trusted domain'
  },
  STARTING_PRICE: {
    REQUIRED: 'Starting price is required',
    POSITIVE: 'Starting price must be positive',
    MIN_VALUE: 'Starting price must be at least $1',
    MAX_VALUE: 'Starting price cannot exceed $999,999.99',
    INVALID: 'Starting price must be a valid number'
  },
  BUY_NOW_PRICE: {
    POSITIVE: 'Buy now price must be positive',
    MIN_VALUE: 'Buy now price must be at least $1',
    MAX_VALUE: 'Buy now price cannot exceed $999,999.99',
    GREATER_THAN_STARTING: 'Buy now price must be greater than starting price',
    INVALID: 'Buy now price must be a valid number'
  },
  DURATION: {
    REQUIRED: 'Please select a duration',
    INVALID: 'Please select a valid duration'
  }
} as const
