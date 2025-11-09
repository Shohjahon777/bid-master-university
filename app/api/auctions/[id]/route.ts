import { NextRequest, NextResponse } from 'next/server'
import { getAuctionById } from '@/lib/actions/auctions'

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
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      bids: auction.bids.map(bid => ({
        ...bid,
        createdAt: bid.createdAt.toISOString()
      })),
      bidCount: auction._count?.bids || 0
    }
    return NextResponse.json(serialized)
  } catch (error) {
    console.error('[API] Error fetching auction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
