'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  DollarSign,
  TrendingDown,
  Trophy,
  Calendar,
  X,
  CheckCheck,
  Gavel,
  FileX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/utils'
import { NotificationType } from '@prisma/client'
import { supabase } from '@/lib/supabase'
import { markAsRead, markAllAsRead } from '@/lib/notifications'

interface Notification {
  id: string
  type: NotificationType
  message: string
  read: boolean
  link: string | null
  userId: string
  createdAt: string
}

interface NotificationDropdownProps {
  userId: string
}

// Get icon for notification type
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.BID_OUTBID:
      return <TrendingDown className="h-4 w-4 text-red-500" />
    case NotificationType.BID_PLACED:
      return <DollarSign className="h-4 w-4 text-blue-500" />
    case NotificationType.AUCTION_WON:
      return <Trophy className="h-4 w-4 text-yellow-500" />
    case NotificationType.AUCTION_ENDED:
      return <Calendar className="h-4 w-4 text-orange-500" />
    case NotificationType.AUCTION_CANCELLED:
      return <FileX className="h-4 w-4 text-gray-500" />
    case NotificationType.AUCTION_CREATED:
      return <Gavel className="h-4 w-4 text-green-500" />
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      
      const data = await response.json()
      if (data.success && data.notifications) {
        setNotifications(data.notifications)
        const unread = data.notifications.filter((n: Notification) => !n.read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Fetch on mount
  useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId, fetchNotifications])

  // Set up Supabase Realtime subscription for notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification
          // Add new notification to the beginning of the list
          setNotifications((prev) => {
            const exists = prev.find((n) => n.id === newNotification.id)
            if (exists) return prev
            const updated = [newNotification, ...prev].slice(0, 10)
            return updated
          })
          // Update unread count
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          )
          // Update unread count
          if (updatedNotification.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to notifications for user:', userId)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to notifications')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      const result = await markAsRead(notification.id)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      const result = await markAllAsRead(userId)
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer focus:bg-accent"
                onClick={() => handleNotificationClick(notification)}
                onSelect={(e) => {
                  e.preventDefault()
                  handleNotificationClick(notification)
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
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
                </div>

                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                asChild
              >
                <Link href="/notifications">View all notifications</Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

