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
      console.error('Failed to fetch notifications:', result.error)
      // Return empty array instead of error to prevent UI breakage
      return NextResponse.json({
        success: true,
        notifications: [],
        error: result.error
      })
    }

    // Serialize notifications with error handling
    const notifications = (result.notifications || []).map((notification) => {
      try {
        return {
          ...notification,
          createdAt: notification.createdAt instanceof Date 
            ? notification.createdAt.toISOString() 
            : new Date(notification.createdAt).toISOString(),
        }
      } catch (err) {
        console.error('Error serializing notification:', err, notification)
        return {
          ...notification,
          createdAt: new Date().toISOString(),
        }
      }
    })

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error('Error in notifications API:', error)
    // Return empty array instead of error to prevent UI breakage
    return NextResponse.json({
      success: true,
      notifications: [],
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}

