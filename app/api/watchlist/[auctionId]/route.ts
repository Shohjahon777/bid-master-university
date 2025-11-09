import { NextRequest, NextResponse } from 'next/server'
import { isInWatchlist } from '@/lib/actions/watchlist'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> },
) {
  try {
    const { auctionId } = await params

    if (!auctionId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 },
      )
    }

    const inWatchlist = await isInWatchlist(auctionId)

    return NextResponse.json({
      success: true,
      isInWatchlist: inWatchlist,
    })
  } catch (error) {
    console.error('Error determining watchlist status:', error)
    return NextResponse.json(
      { success: false, error: 'Unable to determine watchlist status' },
      { status: 500 },
    )
  }
}

