import { NextRequest, NextResponse } from 'next/server'
import { getAuctions } from '@/lib/actions/auctions'
import { AUCTIONS_LIST_TAG, AUCTIONS_RECENT_TAG } from '@/lib/auctions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse query parameters
    const q = searchParams.get('q') || undefined
    const category = searchParams.get('category') || undefined
    const condition = searchParams.get('condition') || undefined
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
    const sort = (searchParams.get('sort') as 'newest' | 'ending' | 'price_low' | 'price_high') || 'newest'
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 12

    // Map sort values to getAuctions format
    const sortByMap: Record<string, 'newest' | 'ending' | 'price_low' | 'price_high'> = {
      'newest': 'newest',
      'ending-soon': 'ending',
      'price-asc': 'price_low',
      'price-desc': 'price_high'
    }
    
    const sortBy = sortByMap[sort] || 'newest'

    // Build filters
    const filters = {
      search: q,
      category,
      condition,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit
    }

    // Fetch auctions with filters
    const result = await getAuctions(filters)

    const response = NextResponse.json(
      {
        success: true,
        auctions: result.auctions,
        pagination: result.pagination,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    )
    response.headers.set(
      'x-next-cache-tags',
      `${AUCTIONS_LIST_TAG},${AUCTIONS_RECENT_TAG}`,
    )
    return response
  } catch (error) {
    console.error('Error in search API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search auctions',
        auctions: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      { status: 500 }
    )
  }
}

