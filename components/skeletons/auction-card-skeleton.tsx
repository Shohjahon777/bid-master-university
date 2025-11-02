'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AuctionCardSkeletonProps {
  view?: 'grid' | 'list'
}

/**
 * Loading skeleton for AuctionCard component
 * Matches the layout of AuctionCard with shimmer effect
 */
export function AuctionCardSkeleton({ view = 'grid' }: AuctionCardSkeletonProps) {
  if (view === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-row gap-6 p-4">
          {/* Image skeleton - horizontal list view */}
          <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-muted rounded-lg">
            <Skeleton className="h-full w-full animate-pulse" />
          </div>

          {/* Content skeleton - horizontal list view */}
          <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Grid view (default)
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Skeleton className="h-full w-full animate-pulse" />
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Title */}
          <Skeleton className="h-5 w-3/4" />
          
          {/* Price and bid count */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>

          {/* Seller info */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}

