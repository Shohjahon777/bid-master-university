import { AuctionCardSkeleton } from '@/components/skeletons/auction-card-skeleton'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function FilterSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
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
      
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-3">
        <Skeleton className="h-5 w-16" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AuctionsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="p-6">
            <FilterSkeleton />
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Auctions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <AuctionCardSkeleton key={i} view="grid" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
