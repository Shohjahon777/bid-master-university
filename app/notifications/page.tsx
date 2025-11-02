import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { NotificationType } from '@prisma/client'
import { getNotifications } from '@/lib/notifications'
import { NotificationsClient } from './notifications-client'

interface NotificationsPageProps {
  searchParams: Promise<{
    filter?: 'all' | 'unread' | 'bids' | 'auctions' | 'system'
    page?: string
  }>
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const params = await searchParams
  const filter = params.filter || 'all'
  const page = parseInt(params.page || '1', 10)
  
  // Map filter to notification type or read status
  const filters: {
    read?: boolean
    type?: NotificationType
    types?: NotificationType[]
    page: number
    limit: number
  } = {
    page,
    limit: 20,
  }
  
  if (filter === 'unread') {
    filters.read = false
  } else if (filter === 'bids') {
    // Bid-related notifications
    filters.types = [NotificationType.BID_PLACED, NotificationType.BID_OUTBID]
  } else if (filter === 'auctions') {
    // Auction-related notifications
    filters.types = [
      NotificationType.AUCTION_WON,
      NotificationType.AUCTION_ENDED,
      NotificationType.AUCTION_CANCELLED,
      NotificationType.AUCTION_CREATED,
    ]
  }
  
  const result = await getNotifications(user.id, filters)
  
  return (
    <NotificationsClient
      userId={user.id}
      initialNotifications={result.notifications}
      initialTotal={result.total}
      initialPage={page}
      initialFilter={filter}
    />
  )
}

