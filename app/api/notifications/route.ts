import { NextRequest, NextResponse } from 'next/server'
import { getUserNotifications } from '@/lib/actions/bids'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 10

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await getUserNotifications(userId, limit)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Serialize notifications
    const notifications = result.notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

