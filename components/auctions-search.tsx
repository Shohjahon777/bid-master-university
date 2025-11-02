'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Grid3X3, List, Filter, X, Loader2 } from 'lucide-react'
import { debounce } from '@/lib/utils'

interface AuctionsSearchProps {
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
  }
}

export function AuctionsSearch({ currentFilters }: AuctionsSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '')
  const [isSearching, setIsSearching] = useState(false)
  
  // Get current view from URL params (default to 'grid')
  const currentView = searchParams.get('view') || 'grid'

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/auctions?${params.toString()}`)
  }, [router, searchParams])

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      updateFilter('search', query.trim() || null)
      setIsSearching(false)
    }, 300),
    [updateFilter]
  )

  // Update search query and trigger debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setIsSearching(true)
    debouncedSearch(value)
  }

  // Handle form submission (immediate search)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    updateFilter('search', searchQuery.trim() || null)
    setIsSearching(false)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    updateFilter('search', null)
  }

  // Sync search query with URL params
  useEffect(() => {
    setSearchQuery(currentFilters.search || '')
  }, [currentFilters.search])

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'ending', label: 'Ending Soon' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' }
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </form>

      {/* Sort Dropdown */}
      <Select
        value={currentFilters.sortBy || 'newest'}
        onValueChange={(value) => updateFilter('sortBy', value)}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <div className="flex items-center gap-1 border rounded-md p-1">
        <Button
          variant={currentView === 'grid' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="Grid view"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('view', 'grid')
            router.push(`/auctions?${params.toString()}`)
          }}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={currentView === 'list' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          title="List view"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('view', 'list')
            router.push(`/auctions?${params.toString()}`)
          }}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Filter Toggle */}
      <Button
        variant="outline"
        size="sm"
        className="sm:hidden"
        title="Filters"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
      </Button>
    </div>
  )
}
