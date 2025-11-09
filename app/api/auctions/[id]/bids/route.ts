import { NextRequest, NextResponse } from 'next/server'
import { getBidHistory } from '@/lib/actions/bids'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined
    const limit = parsedLimit && Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 50))
      : 10

    const result = await getBidHistory(id, limit)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to fetch bids' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      bids: result.bids,
      count: result.bids?.length ?? 0
    })
  } catch (error) {
    console.error('[API] Error fetching bid history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bid history' },
      { status: 500 }
    )
  }
}


