import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns"
import { Auction, AuctionStatus } from "@prisma/client"

// Utility function for merging class names (shadcn/ui pattern)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency amount
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date for display
export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy')
}

// Format date and time for display
export function formatDateTime(date: Date): string {
  return format(date, 'MMM dd, yyyy HH:mm')
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = differenceInMinutes(now, date)
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = differenceInHours(now, date)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = differenceInDays(now, date)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return formatDate(date)
}

// Get time remaining until auction ends
export function getTimeRemaining(endTime: Date | string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
  isExpired: boolean
} {
  const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime
  const now = new Date()
  const total = endTimeDate.getTime() - now.getTime()
  const isExpired = total <= 0

  if (isExpired) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true,
    }
  }

  const days = differenceInDays(endTimeDate, now)
  const hours = differenceInHours(endTimeDate, now) % 24
  const minutes = differenceInMinutes(endTimeDate, now) % 60
  const seconds = differenceInSeconds(endTimeDate, now) % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    total,
    isExpired: false,
  }
}

// Check if auction is currently active
export function isAuctionActive(auction: { status: AuctionStatus, startTime: Date | string, endTime: Date | string }): boolean {
  const now = new Date()
  const startTime = typeof auction.startTime === 'string' ? new Date(auction.startTime) : auction.startTime
  const endTime = typeof auction.endTime === 'string' ? new Date(auction.endTime) : auction.endTime
  return (
    auction.status === AuctionStatus.ACTIVE &&
    startTime <= now &&
    endTime > now
  )
}

// Check if auction has ended
export function isAuctionEnded(auction: { status: AuctionStatus, endTime: Date | string }): boolean {
  const now = new Date()
  const endTime = typeof auction.endTime === 'string' ? new Date(auction.endTime) : auction.endTime
  return auction.status === AuctionStatus.ENDED || endTime <= now
}

// Check if auction is cancelled
export function isAuctionCancelled(auction: { status: AuctionStatus }): boolean {
  return auction.status === AuctionStatus.CANCELLED
}

// Calculate minimum bid amount (current price + minimum increment)
export function calculateMinimumBid(currentPrice: number): number {
  // Minimum bid increment is 5% of current price or $1, whichever is higher
  const increment = Math.max(currentPrice * 0.05, 1)
  return Math.ceil((currentPrice + increment) * 100) / 100 // Round up to nearest cent
}

// Calculate bid increment based on current price
export function calculateBidIncrement(currentPrice: number): number {
  if (currentPrice < 10) return 0.25
  if (currentPrice < 50) return 0.50
  if (currentPrice < 100) return 1.00
  if (currentPrice < 500) return 2.50
  if (currentPrice < 1000) return 5.00
  if (currentPrice < 5000) return 10.00
  if (currentPrice < 10000) return 25.00
  return 50.00
}

// Format time remaining as string
export function formatTimeRemaining(endTime: Date): string {
  const timeRemaining = getTimeRemaining(endTime)
  
  if (timeRemaining.isExpired) {
    return 'Auction ended'
  }

  const { days, hours, minutes, seconds } = timeRemaining

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Generate auction status badge variant
export function getAuctionStatusVariant(status: AuctionStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case AuctionStatus.ACTIVE:
      return 'default'
    case AuctionStatus.ENDED:
      return 'secondary'
    case AuctionStatus.CANCELLED:
      return 'destructive'
    default:
      return 'default'
  }
}

// Generate auction status text
export function getAuctionStatusText(auction: { status: AuctionStatus, startTime: Date | string, endTime: Date | string, winnerId?: string | null }): string {
  if (isAuctionCancelled(auction)) {
    return 'Cancelled'
  }
  
  if (isAuctionEnded(auction)) {
    return auction.winnerId ? 'Sold' : 'Ended'
  }
  
  if (isAuctionActive(auction)) {
    return 'Active'
  }
  
  return 'Upcoming'
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate random string for IDs
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Debounce function for search inputs
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | undefined
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}