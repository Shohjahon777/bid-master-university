'use client'

import { AuctionCardSkeleton } from './auction-card-skeleton'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AuctionsListSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar Skeleton */}
      <div className="lg:w-64 flex-shrink-0">
        <Card className="p-6">
          <div className="space-y-6">
            <Skeleton className="h-5 w-16" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AuctionCardSkeleton key={i} view="grid" />
          ))}
        </div>
      </div>
    </div>
  )
}

