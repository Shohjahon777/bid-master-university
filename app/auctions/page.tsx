import { AuctionCard } from '@/components/auction-card'
import { AuctionsFilters } from '@/components/auctions-filters'
import { AuctionsSearch } from '@/components/auctions-search'
import { AuctionsList } from '@/components/auctions-list'
import { getAuctions, getCategories, getConditions } from '@/lib/actions/auctions'

interface AuctionsPageProps {
  searchParams: {
    search?: string
    category?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    endingSoon?: string
    buyNowOnly?: string
    sortBy?: string
    page?: string
  }
}

export default async function AuctionsPage({ searchParams }: AuctionsPageProps) {
  // Parse search params
  const filters = {
    search: searchParams.search,
    category: searchParams.category,
    condition: searchParams.condition,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    endingSoon: searchParams.endingSoon === 'true',
    buyNowOnly: searchParams.buyNowOnly === 'true',
    sortBy: (searchParams.sortBy as any) || 'newest',
    page: searchParams.page ? Number(searchParams.page) : 1,
    limit: 12
  }

  // Fetch data in parallel
  const [auctionsData, categories, conditions] = await Promise.all([
    getAuctions(filters),
    getCategories(),
    getConditions()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Auctions</h1>
        <p className="text-muted-foreground">
          Discover amazing items from fellow students
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <AuctionsFilters
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
            auctions={auctionsData.auctions}
            pagination={auctionsData.pagination}
            currentFilters={filters}
          />
        </div>
      </div>
    </div>
  )
}

