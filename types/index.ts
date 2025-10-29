import { User, Auction, Bid, Notification, AuctionStatus, NotificationType } from '@prisma/client'

// Re-export Prisma generated types
export type { User, Auction, Bid, Notification, AuctionStatus, NotificationType }

// Auction Category enum
export enum AuctionCategory {
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  BOOKS = 'BOOKS',
  FURNITURE = 'FURNITURE',
  SPORTS = 'SPORTS',
  JEWELRY = 'JEWELRY',
  ART = 'ART',
  COLLECTIBLES = 'COLLECTIBLES',
  VEHICLES = 'VEHICLES',
  OTHER = 'OTHER'
}

// Extended types with relations
export type AuctionWithUser = Auction & {
  user: Pick<User, 'id' | 'name' | 'avatar' | 'university' | 'verified'>
}

export type AuctionWithRelations = Auction & {
  user: Pick<User, 'id' | 'name' | 'avatar' | 'university' | 'verified'>
  bids: BidWithUser[]
  winner?: Pick<User, 'id' | 'name' | 'avatar'> | null
  _count?: {
    bids: number
  }
}

export type BidWithUser = Bid & {
  user: Pick<User, 'id' | 'name' | 'avatar' | 'university'>
}

export type NotificationWithUser = Notification & {
  user: Pick<User, 'id' | 'name' | 'email'>
}

// Form types
export interface CreateAuctionData {
  title: string
  description: string
  category: AuctionCategory
  condition: string
  images: string[]
  startingPrice: number
  buyNowPrice?: number
  endTime: Date
}

export interface CreateBidData {
  amount: number
  auctionId: string
}

export interface UpdateUserData {
  name?: string
  avatar?: string
  university?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Time remaining type
export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number // total milliseconds
  isExpired: boolean
}

// Auction filter types
export interface AuctionFilters {
  category?: AuctionCategory
  status?: AuctionStatus
  minPrice?: number
  maxPrice?: number
  search?: string
  university?: string
}

// User profile types
export interface UserProfile extends Pick<User, 'id' | 'name' | 'avatar' | 'university' | 'verified'> {
  _count?: {
    auctions: number
    bids: number
    wonAuctions: number
  }
}
