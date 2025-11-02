'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Sparkles, 
  Shirt, 
  BookOpen, 
  Sofa, 
  Dumbbell, 
  Gem, 
  Palette, 
  Star, 
  Car, 
  Package,
  CheckCircle2,
  Circle,
  DollarSign,
  Clock,
  Tag
} from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count: number
}

interface AuctionFiltersProps {
  initialFilters?: {
    categories?: string[]
    minPrice?: number
    maxPrice?: number
    condition?: string
    hasBuyNow?: boolean
    endingSoon?: boolean
    newListings?: boolean
    sortBy?: string
  }
  categories: FilterOption[]
  conditions: FilterOption[]
  onFilterChange: (filters: {
    categories?: string[]
    minPrice?: number
    maxPrice?: number
    condition?: string
    hasBuyNow?: boolean
    endingSoon?: boolean
    newListings?: boolean
    sortBy?: string
  }) => void
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ELECTRONICS: Sparkles,
  CLOTHING: Shirt,
  BOOKS: BookOpen,
  FURNITURE: Sofa,
  SPORTS: Dumbbell,
  JEWELRY: Gem,
  ART: Palette,
  COLLECTIBLES: Star,
  VEHICLES: Car,
  OTHER: Package,
}

const CONDITION_ICONS: Record<string, React.ElementType> = {
  New: CheckCircle2,
  'Like New': Circle,
  Good: Circle,
  Fair: Circle,
  Poor: Circle,
}

const PRESET_PRICE_RANGES = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200+', min: 200, max: 1000 },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export function AuctionFilters({ 
  initialFilters = {}, 
  categories, 
  conditions,
  onFilterChange 
}: AuctionFiltersProps) {
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories || []
  )
  const [priceRange, setPriceRange] = useState<number[]>([
    initialFilters.minPrice || 0,
    initialFilters.maxPrice || 1000
  ])
  const [condition, setCondition] = useState<string>(
    initialFilters.condition || 'all'
  )
  const [hasBuyNow, setHasBuyNow] = useState<boolean>(
    initialFilters.hasBuyNow || false
  )
  const [endingSoon, setEndingSoon] = useState<boolean>(
    initialFilters.endingSoon || false
  )
  const [newListings, setNewListings] = useState<boolean>(
    initialFilters.newListings || false
  )
  const [sortBy, setSortBy] = useState<string>(
    initialFilters.sortBy || 'newest'
  )

  // Local state for price inputs
  const [minPriceInput, setMinPriceInput] = useState<string>(String(priceRange[0]))
  const [maxPriceInput, setMaxPriceInput] = useState<string>(String(priceRange[1]))

  // Update price inputs when slider changes
  useEffect(() => {
    setMinPriceInput(String(priceRange[0]))
    setMaxPriceInput(String(priceRange[1]))
  }, [priceRange])

  // Initialize from URL params
  useEffect(() => {
    if (initialFilters) {
      setSelectedCategories(initialFilters.categories || [])
      setPriceRange([
        initialFilters.minPrice || 0,
        initialFilters.maxPrice || 1000
      ])
      setCondition(initialFilters.condition || 'all')
      setHasBuyNow(initialFilters.hasBuyNow || false)
      setEndingSoon(initialFilters.endingSoon || false)
      setNewListings(initialFilters.newListings || false)
      setSortBy(initialFilters.sortBy || 'newest')
    }
  }, [initialFilters])

  // Handle category selection
  const handleCategoryToggle = (categoryValue: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryValue)) {
        return prev.filter(c => c !== categoryValue)
      }
      return [...prev, categoryValue]
    })
  }

  // Select all categories
  const handleSelectAllCategories = () => {
    setSelectedCategories(categories.map(c => c.value))
  }

  // Clear all categories
  const handleClearAllCategories = () => {
    setSelectedCategories([])
  }

  // Handle preset price range
  const handlePresetPriceRange = (min: number, max: number) => {
    setPriceRange([min, max])
    setMinPriceInput(String(min))
    setMaxPriceInput(String(max))
  }

  // Handle price input changes
  const handleMinPriceChange = (value: string) => {
    setMinPriceInput(value)
    const numValue = Number(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= priceRange[1]) {
      setPriceRange([numValue, priceRange[1]])
    }
  }

  const handleMaxPriceChange = (value: string) => {
    setMaxPriceInput(value)
    const numValue = Number(value)
    if (!isNaN(numValue) && numValue >= priceRange[0] && numValue <= 1000) {
      setPriceRange([priceRange[0], numValue])
    }
  }

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange({
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      condition: condition !== 'all' ? condition : undefined,
      hasBuyNow: hasBuyNow || undefined,
      endingSoon: endingSoon || undefined,
      newListings: newListings || undefined,
      sortBy: sortBy !== 'newest' ? sortBy : undefined,
    })
  }

  // Reset all filters
  const handleResetAll = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000])
    setMinPriceInput('0')
    setMaxPriceInput('1000')
    setCondition('all')
    setHasBuyNow(false)
    setEndingSoon(false)
    setNewListings(false)
    setSortBy('newest')
    
    onFilterChange({
      categories: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      condition: undefined,
      hasBuyNow: undefined,
      endingSoon: undefined,
      newListings: undefined,
      sortBy: undefined,
    })
  }

  // Check if any filters are active
  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000 ||
    condition !== 'all' ||
    hasBuyNow ||
    endingSoon ||
    newListings ||
    sortBy !== 'newest'

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              className="text-xs h-7"
            >
              Reset All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Category</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllCategories}
                className="text-xs h-6 px-2"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllCategories}
                className="text-xs h-6 px-2"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.value] || Package
              const isSelected = selectedCategories.includes(category.value)
              
              return (
                <div
                  key={category.value}
                  className="flex items-center space-x-2 hover:bg-accent/50 rounded-md p-1.5 -m-1.5 transition-colors"
                >
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={isSelected}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                  />
                  <Label
                    htmlFor={`category-${category.value}`}
                    className="text-sm flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{category.label}</span>
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    ({category.count})
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t pt-4" />

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Price Range</Label>
          
          {/* Dual Range Slider */}
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>

          {/* Min/Max Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="min-price" className="text-xs text-muted-foreground mb-1 block">
                Min
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="min-price"
                  type="number"
                  value={minPriceInput}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  onBlur={() => {
                    const num = Number(minPriceInput)
                    if (isNaN(num) || num < 0) {
                      setMinPriceInput('0')
                      setPriceRange([0, priceRange[1]])
                    } else if (num > priceRange[1]) {
                      setMinPriceInput(String(priceRange[1]))
                      setPriceRange([priceRange[1], priceRange[1]])
                    }
                  }}
                  className="pl-7 h-9"
                  min={0}
                  max={priceRange[1]}
                />
              </div>
            </div>
            <div className="pt-5">
              <span className="text-muted-foreground">-</span>
            </div>
            <div className="flex-1">
              <Label htmlFor="max-price" className="text-xs text-muted-foreground mb-1 block">
                Max
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="max-price"
                  type="number"
                  value={maxPriceInput}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  onBlur={() => {
                    const num = Number(maxPriceInput)
                    if (isNaN(num) || num > 1000) {
                      setMaxPriceInput('1000')
                      setPriceRange([priceRange[0], 1000])
                    } else if (num < priceRange[0]) {
                      setMaxPriceInput(String(priceRange[0]))
                      setPriceRange([priceRange[0], priceRange[0]])
                    }
                  }}
                  className="pl-7 h-9"
                  min={priceRange[0]}
                  max={1000}
                />
              </div>
            </div>
          </div>

          {/* Preset Ranges */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {PRESET_PRICE_RANGES.map((preset) => (
              <Button
                key={preset.label}
                variant={
                  priceRange[0] === preset.min && priceRange[1] === preset.max
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handlePresetPriceRange(preset.min, preset.max)}
                className="text-xs h-8"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4" />

        {/* Condition Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Condition</Label>
          <RadioGroup
            value={condition}
            onValueChange={setCondition}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 hover:bg-accent/50 rounded-md p-1.5 -m-1.5 transition-colors">
              <RadioGroupItem value="all" id="condition-all" />
              <Label htmlFor="condition-all" className="text-sm cursor-pointer flex-1">
                All Conditions
              </Label>
            </div>
            {conditions.map((conditionOption) => {
              const Icon = CONDITION_ICONS[conditionOption.value] || Circle
              return (
                <div
                  key={conditionOption.value}
                  className="flex items-center space-x-2 hover:bg-accent/50 rounded-md p-1.5 -m-1.5 transition-colors"
                >
                  <RadioGroupItem 
                    value={conditionOption.value} 
                    id={`condition-${conditionOption.value}`} 
                  />
                  <Label
                    htmlFor={`condition-${conditionOption.value}`}
                    className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{conditionOption.label}</span>
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    ({conditionOption.count})
                  </span>
                </div>
              )
            })}
          </RadioGroup>
        </div>

        <div className="border-t pt-4" />

        {/* Auction Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Auction Type</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 hover:bg-accent/50 rounded-md p-1.5 -m-1.5 transition-colors">
              <Checkbox
                id="has-buy-now"
                checked={hasBuyNow}
                onCheckedChange={(checked) => setHasBuyNow(checked === true)}
              />
              <Label htmlFor="has-buy-now" className="text-sm cursor-pointer flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>Has Buy Now</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 hover:bg-accent/50 rounded-md p-1.5 -m-1.5 transition-colors">
              <Checkbox
                id="ending-soon"
                checked={endingSoon}
                onCheckedChange={(checked) => setEndingSoon(checked === true)}
              />
              <Label htmlFor="ending-soon" className="text-sm cursor-pointer flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Ending Soon (&lt; 24h)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 hover:bg-accent/50 rounded-md p-1.5 -m-1.5 transition-colors">
              <Checkbox
                id="new-listings"
                checked={newListings}
                onCheckedChange={(checked) => setNewListings(checked === true)}
              />
              <Label htmlFor="new-listings" className="text-sm cursor-pointer flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>New Listings (&lt; 7 days)</span>
              </Label>
            </div>
          </div>
        </div>

        <div className="border-t pt-4" />

        {/* Sort By */}
        <div className="space-y-3">
          <Label htmlFor="sort-by" className="text-sm font-medium">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          <Button
            onClick={handleApplyFilters}
            className="w-full"
            size="sm"
          >
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={handleResetAll}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Reset All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

