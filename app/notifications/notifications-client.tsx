'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  DollarSign,
  TrendingDown,
  Trophy,
  Calendar,
  CheckCheck,
  Gavel,
  FileX,
  Trash2,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRelativeTime } from '@/lib/utils'
import { NotificationType } from '@prisma/client'
import { CreatedNotification, markAsRead, markAllAsRead, deleteNotification } from '@/lib/notifications'
import { toast } from 'sonner'

interface NotificationsClientProps {
  userId: string
  initialNotifications: CreatedNotification[]
  initialTotal: number
  initialPage: number
  initialFilter: 'all' | 'unread' | 'bids' | 'auctions' | 'system'
}

// Get icon for notification type
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.BID_OUTBID:
      return <TrendingDown className="h-5 w-5 text-red-500" />
    case NotificationType.BID_PLACED:
      return <DollarSign className="h-5 w-5 text-blue-500" />
    case NotificationType.AUCTION_WON:
      return <Trophy className="h-5 w-5 text-yellow-500" />
    case NotificationType.AUCTION_ENDED:
      return <Calendar className="h-5 w-5 text-orange-500" />
    case NotificationType.AUCTION_CANCELLED:
      return <FileX className="h-5 w-5 text-gray-500" />
    case NotificationType.AUCTION_CREATED:
      return <Gavel className="h-5 w-5 text-green-500" />
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

// Get badge variant for notification type
function getTypeBadge(type: NotificationType): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (type) {
    case NotificationType.BID_OUTBID:
      return { label: 'Bid Outbid', variant: 'destructive' as const }
    case NotificationType.BID_PLACED:
      return { label: 'New Bid', variant: 'default' as const }
    case NotificationType.AUCTION_WON:
      return { label: 'Auction Won', variant: 'default' as const }
    case NotificationType.AUCTION_ENDED:
      return { label: 'Auction Ended', variant: 'secondary' as const }
    case NotificationType.AUCTION_CANCELLED:
      return { label: 'Auction Cancelled', variant: 'outline' as const }
    case NotificationType.AUCTION_CREATED:
      return { label: 'Auction Created', variant: 'outline' as const }
    default:
      return { label: 'Notification', variant: 'secondary' as const }
  }
}

// Get user ID from auth - we'll need to pass it as prop or get it from context
// For now, let's assume we get it from the initial data or pass it as prop
export function NotificationsClient({
  userId,
  initialNotifications,
  initialTotal,
  initialPage,
  initialFilter,
}: NotificationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [filter, setFilter] = useState(initialFilter)
  const [isPending, startTransition] = useTransition()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter as typeof filter)
    setPage(1)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('filter', newFilter)
      params.set('page', '1')
      router.push(`/notifications?${params.toString()}`)
      router.refresh()
    })
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markAsRead(notificationId)
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setTotal((prev) => Math.max(0, prev - 1))
      toast.success('Notification marked as read')
    } else {
      toast.error(result.error || 'Failed to mark as read')
    }
  }

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead(userId)
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setTotal(0)
      toast.success(`Marked ${result.count || 0} notifications as read`)
    } else {
      toast.error(result.error || 'Failed to mark all as read')
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingIds((prev) => new Set(prev).add(notificationId))
    try {
      const result = await deleteNotification(notificationId, userId)
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        if (!notifications.find((n) => n.id === notificationId)?.read) {
          setTotal((prev) => Math.max(0, prev - 1))
        }
        toast.success('Notification deleted')
      } else {
        toast.error(result.error || 'Failed to delete notification')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  const handleNotificationClick = async (notification: CreatedNotification) => {
    // Mark as read if unread
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', nextPage.toString())
      router.push(`/notifications?${params.toString()}`)
      router.refresh()
    })
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const hasMore = notifications.length < total

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Manage your notifications and stay updated on your auctions and bids
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              variant="outline"
              className="gap-2 shrink-0"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={handleFilterChange}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="bids">Bids</TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Notifications List */}
          <TabsContent value={filter} className="mt-8">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh] py-16">
                <Card className="w-full max-w-md border-2 border-dashed">
                  <CardContent className="py-16 px-8">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted mx-auto mb-6">
                        <Bell className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold">No notifications</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        {filter === 'unread'
                          ? "You're all caught up! No unread notifications."
                          : filter === 'bids'
                          ? 'No bid-related notifications yet. Start bidding on auctions to receive updates.'
                          : filter === 'auctions'
                          ? 'No auction-related notifications yet. Create an auction or watch one to get started.'
                          : 'You have no notifications yet. When you place bids, create auctions, or receive updates, they will appear here.'}
                      </p>
                      {(filter === 'all' || filter === 'bids') && (
                        <div className="pt-4">
                          <Button asChild variant="outline">
                            <Link href="/auctions">Browse Auctions</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const typeBadge = getTypeBadge(notification.type)
                const isDeleting = deletingIds.has(notification.id)

                return (
                  <Card
                    key={notification.id}
                    className={`transition-all cursor-pointer hover:shadow-md hover:border-primary/30 ${
                      !notification.read ? 'border-primary/30 bg-primary/5 shadow-sm' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge variant={typeBadge.variant} className="text-xs">
                                {typeBadge.label}
                              </Badge>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => handleDelete(notification.id, e)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>

                          <p
                            className={`text-sm ${
                              !notification.read ? 'font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {notification.message}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(new Date(notification.createdAt))}
                          </p>

                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View auction
                              <span>→</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-8 pb-4">
                  <Button
                    variant="outline"
                    className="w-full md:w-auto min-w-[200px] mx-auto flex items-center justify-center"
                    onClick={handleLoadMore}
                    disabled={isPending}
                    size="lg"
                  >
                    {isPending ? 'Loading...' : 'Load more notifications'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

