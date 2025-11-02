'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AuctionFilters } from './auction-filters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { useState } from 'react'

interface FilterOption {
  value: string
  label: string
  count: number
}

interface AuctionFiltersWrapperProps {
  categories: FilterOption[]
  conditions: FilterOption[]
  currentFilters: {
    search?: string
    category?: string
    condition?: string
    minPrice?: number
    maxPrice?: number
    endingSoon?: boolean
    buyNowOnly?: boolean
    newListings?: boolean
    sortBy?: string
    page?: number
  }
}

export function AuctionFiltersWrapper({ 
  categories, 
  conditions, 
  currentFilters 
}: AuctionFiltersWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Parse categories from URL (comma-separated or single)
  const parseCategories = (): string[] => {
    const categoryParam = currentFilters.category
    if (!categoryParam) return []
    // Support both single category and comma-separated
    return categoryParam.split(',').filter(Boolean)
  }

  // Convert filter object to URL params
  const updateURL = (filters: {
    categories?: string[]
    minPrice?: number
    maxPrice?: number
    condition?: string
    hasBuyNow?: boolean
    endingSoon?: boolean
    newListings?: boolean
    sortBy?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    // Handle categories (comma-separated)
    if (filters.categories && filters.categories.length > 0) {
      params.set('category', filters.categories.join(','))
    } else {
      params.delete('category')
    }

    // Handle price range
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      params.set('minPrice', String(filters.minPrice))
    } else {
      params.delete('minPrice')
    }

    if (filters.maxPrice !== undefined && filters.maxPrice < 1000) {
      params.set('maxPrice', String(filters.maxPrice))
    } else {
      params.delete('maxPrice')
    }

    // Handle condition
    if (filters.condition) {
      params.set('condition', filters.condition)
    } else {
      params.delete('condition')
    }

    // Handle auction type filters
    if (filters.hasBuyNow) {
      params.set('buyNowOnly', 'true')
    } else {
      params.delete('buyNowOnly')
    }

    if (filters.endingSoon) {
      params.set('endingSoon', 'true')
    } else {
      params.delete('endingSoon')
    }

    // New listings filter
    if (filters.newListings) {
      params.set('newListings', 'true')
    } else {
      params.delete('newListings')
    }

    // Handle sort
    if (filters.sortBy && filters.sortBy !== 'newest') {
      params.set('sortBy', filters.sortBy)
    } else {
      params.delete('sortBy')
    }

    // Reset to page 1 when filters change
    params.delete('page')

    // Update URL
    router.push(`/auctions?${params.toString()}`)
    
    // Close mobile dialog if open
    setIsMobileOpen(false)
  }

  const initialFilters = {
    categories: parseCategories(),
    minPrice: currentFilters.minPrice,
    maxPrice: currentFilters.maxPrice,
    condition: currentFilters.condition,
    hasBuyNow: currentFilters.buyNowOnly,
    endingSoon: currentFilters.endingSoon,
    newListings: currentFilters.newListings || false,
    sortBy: currentFilters.sortBy || 'newest',
  }

  // Format category labels for display
  const formattedCategories = categories.map(cat => ({
    ...cat,
    label: cat.label || cat.value
  }))

  // Format condition labels
  const formattedConditions = conditions.map(cond => ({
    ...cond,
    label: cond.label || cond.value
  }))

  return (
    <>
      {/* Desktop: Always visible sidebar */}
      <div className="hidden lg:block">
        <AuctionFilters
          initialFilters={initialFilters}
          categories={formattedCategories}
          conditions={formattedConditions}
          onFilterChange={updateURL}
        />
      </div>

      {/* Mobile: Dialog/Drawer */}
      <div className="lg:hidden">
        <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <AuctionFilters
              initialFilters={initialFilters}
              categories={formattedCategories}
              conditions={formattedConditions}
              onFilterChange={updateURL}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

