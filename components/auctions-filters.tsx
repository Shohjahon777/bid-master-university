'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AuctionCategory } from '@/types'

interface FilterOption {
  value: string
  label: string
  count: number
}

interface AuctionsFiltersProps {
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
    sortBy?: string
    page?: number
  }
}

export function AuctionsFilters({ categories, conditions, currentFilters }: AuctionsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [priceRange, setPriceRange] = useState([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || 1000
  ])

  const updateFilter = (key: string, value: string | boolean | number | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === '' || value === false) {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/auctions?${params.toString()}`)
  }

  const resetFilters = () => {
    router.push('/auctions')
  }

  const hasActiveFilters = Object.values(currentFilters).some(value => 
    value !== undefined && value !== '' && value !== false
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <h3 className="font-medium">Category</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="category-all"
                checked={!currentFilters.category || currentFilters.category === 'all'}
                onCheckedChange={(checked) => 
                  updateFilter('category', checked ? 'all' : null)
                }
              />
              <Label htmlFor="category-all" className="text-sm">
                All Categories
              </Label>
            </div>
            {categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.value}`}
                  checked={currentFilters.category === category.value}
                  onCheckedChange={(checked) => 
                    updateFilter('category', checked ? category.value : null)
                  }
                />
                <Label htmlFor={`category-${category.value}`} className="text-sm flex-1">
                  {category.label}
                </Label>
                <span className="text-xs text-muted-foreground">
                  ({category.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-3">
          <h3 className="font-medium">Price Range</h3>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              onValueCommit={(value) => {
                updateFilter('minPrice', value[0])
                updateFilter('maxPrice', value[1])
              }}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-8"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Condition Filter */}
        <div className="space-y-3">
          <h3 className="font-medium">Condition</h3>
          <RadioGroup
            value={currentFilters.condition || 'all'}
            onValueChange={(value) => updateFilter('condition', value === 'all' ? null : value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="condition-all" />
              <Label htmlFor="condition-all" className="text-sm">
                All Conditions
              </Label>
            </div>
            {conditions.map((condition) => (
              <div key={condition.value} className="flex items-center space-x-2">
                <RadioGroupItem value={condition.value} id={`condition-${condition.value}`} />
                <Label htmlFor={`condition-${condition.value}`} className="text-sm flex-1">
                  {condition.label}
                </Label>
                <span className="text-xs text-muted-foreground">
                  ({condition.count})
                </span>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <h3 className="font-medium">Quick Filters</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ending-soon"
                checked={currentFilters.endingSoon || false}
                onCheckedChange={(checked) => updateFilter('endingSoon', checked)}
              />
              <Label htmlFor="ending-soon" className="text-sm">
                Ending Soon (24h)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="buy-now"
                checked={currentFilters.buyNowOnly || false}
                onCheckedChange={(checked) => updateFilter('buyNowOnly', checked)}
              />
              <Label htmlFor="buy-now" className="text-sm">
                Buy Now Available
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
