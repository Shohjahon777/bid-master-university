import { AuctionCard } from '@/components/auction-card'
import { AuctionFiltersWrapper } from '@/components/auction-filters-wrapper'
import { AuctionsSearch } from '@/components/auctions-search'
import { AuctionsList } from '@/components/auctions-list'
import { getAuctions, getCategories, getConditions } from '@/lib/actions/auctions'
import { Suspense } from 'react'
import { AuctionsListSkeleton } from '@/components/skeletons/auctions-list-skeleton'

interface AuctionsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    endingSoon?: string
    buyNowOnly?: string
    newListings?: string
    sortBy?: string
    page?: string
    view?: string
  }>
}

// Separate component for data fetching to allow Suspense
async function AuctionsContent({ searchParams }: AuctionsPageProps) {
  const params = await searchParams
  
  // Parse search params
  // Map sortBy values from URL format to API format
  const sortByMap: Record<string, 'newest' | 'ending' | 'price_low' | 'price_high'> = {
    'newest': 'newest',
    'ending-soon': 'ending',
    'price-asc': 'price_low',
    'price-desc': 'price_high'
  }
  
  const sortByParam = params.sortBy as keyof typeof sortByMap
  const sortBy = sortByMap[sortByParam] || 'newest'
  
  const filters = {
    search: params.search,
    category: params.category,
    condition: params.condition,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    endingSoon: params.endingSoon === 'true',
    buyNowOnly: params.buyNowOnly === 'true',
    newListings: params.newListings === 'true',
    sortBy,
    page: params.page ? Number(params.page) : 1,
    limit: 12,
    view: params.view || 'grid'
  }

  // Fetch data in parallel with optimized queries
  const [auctionsData, categories, conditions] = await Promise.all([
    getAuctions(filters),
    getCategories(),
    getConditions()
  ])

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <AuctionFiltersWrapper
            categories={categories}
            conditions={conditions}
            currentFilters={filters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Sort Bar */}
          <AuctionsSearch currentFilters={filters} />

          {/* Auctions List */}
          <AuctionsList
            auctions={auctionsData.auctions as any}
            pagination={auctionsData.pagination}
            currentFilters={filters}
          />
        </div>
      </div>
    </>
  )
}

export default async function AuctionsPage({ searchParams }: AuctionsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Auctions</h1>
        <p className="text-muted-foreground">
          Discover amazing items from fellow students
        </p>
      </div>

      <Suspense fallback={<AuctionsListSkeleton />}>
        <AuctionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
