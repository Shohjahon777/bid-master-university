'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AuctionWithRelations, AuctionCategory, AuctionStatus } from '@/types'
import type { SerializableAuction } from '@/lib/auctions'
import { 
  formatCurrency, 
  getTimeRemaining, 
  truncateText, 
  getInitials,
  isAuctionActive,
  isAuctionEnded,
  isAuctionCancelled,
  getAuctionStatusText
} from '@/lib/utils'

interface AuctionCardProps {
  auction: AuctionWithRelations | SerializableAuction
  view?: 'grid' | 'list'
}

export function AuctionCard({ auction, view = 'grid' }: AuctionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(() => 
    getTimeRemaining(auction.endTime)
  )

  // Update countdown every second
  useEffect(() => {
    if (timeRemaining.isExpired) return

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(auction.endTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [auction.endTime, timeRemaining.isExpired])

  const formatTimeRemaining = () => {
    if (timeRemaining.isExpired) return 'Ended'
    
    const { days, hours, minutes, seconds } = timeRemaining
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ELECTRONICS: 'bg-blue-100 text-blue-800 border-blue-200',
      CLOTHING: 'bg-pink-100 text-pink-800 border-pink-200',
      BOOKS: 'bg-green-100 text-green-800 border-green-200',
      FURNITURE: 'bg-amber-100 text-amber-800 border-amber-200',
      SPORTS: 'bg-orange-100 text-orange-800 border-orange-200',
      JEWELRY: 'bg-purple-100 text-purple-800 border-purple-200',
      ART: 'bg-red-100 text-red-800 border-red-200',
      COLLECTIBLES: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      VEHICLES: 'bg-gray-100 text-gray-800 border-gray-200',
      OTHER: 'bg-slate-100 text-slate-800 border-slate-200'
    }
    return colors[category] || colors.OTHER
  }

  const getConditionColor = (condition: string) => {
    const conditions: Record<string, string> = {
      'New': 'bg-green-100 text-green-800 border-green-200',
      'Like New': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Good': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Fair': 'bg-orange-100 text-orange-800 border-orange-200',
      'Poor': 'bg-red-100 text-red-800 border-red-200'
    }
    return conditions[condition] || conditions['Good']
  }

  const isActive = isAuctionActive(auction)
  const isEnded = isAuctionEnded(auction)
  const isCancelled = isAuctionCancelled(auction)
  const statusText = getAuctionStatusText(auction)
  const bidCount = auction._count?.bids || 0
  const hasBuyNow = auction.buyNowPrice && Number(auction.buyNowPrice) > 0

  // Render list view (horizontal - one auction per row)
  if (view === 'list') {
    return (
      <Link href={`/auctions/${auction.id}`} className="block group w-full">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50 hover:border-border w-full">
          <div className="flex flex-row gap-6 p-4">
            {/* Image Section - Horizontal List View */}
            <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-muted rounded-lg">
              {auction.images.length > 0 ? (
                <Image
                  src={auction.images[0]}
                  alt={auction.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="192px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm">No image</p>
                  </div>
                </div>
              )}
              
              {/* Overlay badges - Horizontal List View */}
              <div className="absolute top-2 left-2 flex flex-col gap-2">
                <Badge 
                  className={`${getCategoryColor(auction.category)} border text-xs`}
                  variant="outline"
                >
                  {auction.category}
                </Badge>
                <Badge 
                  className={`${getConditionColor(auction.condition)} border text-xs`}
                  variant="outline"
                >
                  {auction.condition}
                </Badge>
              </div>

              {/* Status and Buy Now badges - Horizontal List View */}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <Badge 
                  variant={isActive ? 'default' : isEnded ? 'secondary' : 'destructive'}
                  className="font-medium text-xs"
                >
                  {statusText}
                </Badge>
                {hasBuyNow && isActive && (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs">
                    Buy Now
                  </Badge>
                )}
              </div>

              {/* Time remaining overlay - Horizontal List View */}
              {isActive && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1">
                    <p className="text-white text-xs font-medium text-center">
                      {formatTimeRemaining()} left
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Content Section - Horizontal List View */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="flex-1">
                <h3 className="font-semibold text-xl leading-tight mb-2 group-hover:text-primary transition-colors">
                  {auction.title}
                </h3>
                
                {/* Price and bid info */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(Number(auction.currentPrice))}
                  </span>
                  {bidCount > 0 && (
                    <Badge variant="outline" className="text-sm">
                      {bidCount} bid{bidCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Starting price and Buy Now */}
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  {Number(auction.currentPrice) > Number(auction.startingPrice) && (
                    <span className="text-muted-foreground">
                      Started at {formatCurrency(Number(auction.startingPrice))}
                    </span>
                  )}
                  {hasBuyNow && (
                    <span className="text-green-600 font-medium">
                      Buy Now: {formatCurrency(Number(auction.buyNowPrice!))}
                    </span>
                  )}
                </div>
              </div>

              {/* Seller info */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={auction.user.avatar || undefined} />
                  <AvatarFallback>
                    {getInitials(auction.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {auction.user.name}
                    {auction.user.verified && (
                      <span className="ml-1 text-blue-500">✓</span>
                    )}
                  </p>
                  {auction.user.university && (
                    <p className="text-xs text-muted-foreground truncate">
                      {auction.user.university}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  // Render grid view (default)
  return (
    <Link href={`/auctions/${auction.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-border/50 hover:border-border">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {auction.images.length > 0 ? (
            <Image
              src={auction.images[0]}
              alt={auction.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge 
              className={`${getCategoryColor(auction.category)} border`}
              variant="outline"
            >
              {auction.category}
            </Badge>
            <Badge 
              className={`${getConditionColor(auction.condition)} border`}
              variant="outline"
            >
              {auction.condition}
            </Badge>
          </div>

          {/* Status and Buy Now badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Badge 
              variant={isActive ? 'default' : isEnded ? 'secondary' : 'destructive'}
              className="font-medium"
            >
              {statusText}
            </Badge>
            {hasBuyNow && isActive && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white border-0">
                Buy Now
              </Badge>
            )}
          </div>

          {/* Time remaining overlay */}
          {isActive && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white text-sm font-medium text-center">
                  {formatTimeRemaining()} left
                </p>
              </div>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">
                {truncateText(auction.title, 60)}
              </h3>
              
              {/* Price and bid info */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(auction.currentPrice))}
                </span>
                {bidCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {bidCount} bid{bidCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Seller info */}
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={auction.user.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(auction.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">
                    {auction.user.name}
                    {auction.user.verified && (
                      <span className="ml-1 text-blue-500">✓</span>
                    )}
                  </p>
                  {auction.user.university && (
                    <p className="text-xs text-muted-foreground truncate">
                      {auction.user.university}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Starting price info */}
          {Number(auction.currentPrice) > Number(auction.startingPrice) && (
            <div className="text-sm text-muted-foreground">
              Started at {formatCurrency(Number(auction.startingPrice))}
            </div>
          )}
          
          {/* Buy Now price */}
          {hasBuyNow && (
            <div className="text-sm text-green-600 font-medium mt-2">
              Buy Now: {formatCurrency(Number(auction.buyNowPrice!))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}