import { NextRequest, NextResponse } from 'next/server'
import { getAuctionById, AUCTIONS_LIST_TAG, getAuctionDetailTag } from '@/lib/auctions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auction = await getAuctionById(id)
    
    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Serialize Date objects to ISO strings for JSON response
    const serialized = {
      ...auction,
      bidCount: auction._count?.bids || 0
    }
    const response = NextResponse.json(serialized, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    })
    response.headers.set(
      'x-next-cache-tags',
      `${AUCTIONS_LIST_TAG},${getAuctionDetailTag(id)}`,
    )
    return response
  } catch (error) {
    console.error('[API] Error fetching auction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
