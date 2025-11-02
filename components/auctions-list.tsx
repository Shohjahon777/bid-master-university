'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AuctionCard } from '@/components/auction-card'
import { Button } from '@/components/ui/button'
import { AuctionWithRelations } from '@/types'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface AuctionsListProps {
  auctions: AuctionWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  currentFilters: {
    search?: string
    category?: string
    condition?: string
    minPrice?: number
    maxPrice?: number
    endingSoon?: boolean
    buyNowOnly?: boolean
    sortBy?: string
    page?: number
    view?: string
  }
}

export function AuctionsList({ auctions, pagination, currentFilters }: AuctionsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasResults = auctions.length > 0

  // Check if any filters are active (excluding page and default sortBy)
  const hasActiveFilters = Object.entries(currentFilters).some(([key, value]) => {
    if (key === 'page' || (key === 'sortBy' && value === 'newest')) return false
    return value !== undefined && value !== '' && value !== false
  })

  const clearFilters = () => {
    router.push('/auctions')
  }

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your filters or search terms
        </p>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear all filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Count and Clear Filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
          <span className="font-medium text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
          <span className="font-medium text-foreground">{pagination.total}</span> {pagination.total === 1 ? 'auction' : 'auctions'}
        </p>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Auctions Grid or List */}
      {currentFilters.view === 'list' ? (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} view="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} view="grid" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrev}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(pagination.page - 1))
              router.push(`/auctions?${params.toString()}`)
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1
              const isCurrentPage = pageNum === pagination.page
              
              return (
                <Button
                  key={pageNum}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('page', String(pageNum))
                    router.push(`/auctions?${params.toString()}`)
                  }}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNext}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(pagination.page + 1))
              router.push(`/auctions?${params.toString()}`)
            }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
