'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  Clock, 
  DollarSign,
  Eye,
  Gavel,
  Plus,
  Trash2
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { WatchlistItem } from "@/lib/actions/watchlist"
import { removeFromWatchlist } from "@/lib/actions/watchlist"
import { getTimeRemaining, formatCurrency, formatRelativeTime } from "@/lib/utils"
import { AuctionStatus } from "@prisma/client"
import { useState } from "react"
import { toast } from "sonner"

interface WatchlistClientProps {
  watchlistItems: WatchlistItem[]
}

export function WatchlistClient({ watchlistItems: initialItems }: WatchlistClientProps) {
  const [watchlistItems, setWatchlistItems] = useState(initialItems)
  const [removing, setRemoving] = useState<string | null>(null)

  const getStatusColor = (status: AuctionStatus) => {
    switch (status) {
      case AuctionStatus.ACTIVE:
        return "default"
      case AuctionStatus.ENDED:
        return "secondary"
      case AuctionStatus.CANCELLED:
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: AuctionStatus) => {
    switch (status) {
      case AuctionStatus.ACTIVE:
        return "Active"
      case AuctionStatus.ENDED:
        return "Ended"
      case AuctionStatus.CANCELLED:
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  const formatTimeRemaining = (endTime: string) => {
    const timeRemaining = getTimeRemaining(new Date(endTime))
    if (timeRemaining.isExpired) return 'Ended'
    
    const { days, hours, minutes, seconds } = timeRemaining
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const handleRemove = async (auctionId: string) => {
    if (removing) return
    
    setRemoving(auctionId)
    try {
      const result = await removeFromWatchlist(auctionId)
      if (result.success) {
        setWatchlistItems(prev => prev.filter(item => item.auctionId !== auctionId))
        toast.success('Removed from watchlist')
      } else {
        toast.error(result.error || 'Failed to remove from watchlist')
      }
    } catch {
      toast.error('Failed to remove from watchlist')
    } finally {
      setRemoving(null)
    }
  }

  const activeItems = watchlistItems.filter(item => 
    item.auction.status === AuctionStatus.ACTIVE
  )
  const endedItems = watchlistItems.filter(item => 
    item.auction.status === AuctionStatus.ENDED || item.auction.status === AuctionStatus.CANCELLED
  )

  const endingSoonItems = activeItems.filter(item => {
    const timeRemaining = getTimeRemaining(new Date(item.auction.endTime))
    return !timeRemaining.isExpired && timeRemaining.total < 24 * 60 * 60 * 1000 // Less than 24 hours
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Watchlist</h2>
          <p className="text-muted-foreground">
            Keep track of auctions you&apos;re interested in.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/auctions">
            <Plus className="mr-2 h-4 w-4" />
            Browse Auctions
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{activeItems.length}</div>
                <div className="text-sm text-muted-foreground">Active Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{endingSoonItems.length}</div>
                <div className="text-sm text-muted-foreground">Ending Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gavel className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{endedItems.length}</div>
                <div className="text-sm text-muted-foreground">Recently Ended</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="mr-2 h-5 w-5" />
            Active Watchlist
          </CardTitle>
          <CardDescription>
            Auctions you&apos;re currently watching
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeItems.map((item) => {
                const timeRemaining = getTimeRemaining(new Date(item.auction.endTime))
                const isEndingSoon = !timeRemaining.isExpired && timeRemaining.total < 24 * 60 * 60 * 1000
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {item.auction.images.length > 0 ? (
                        <Image
                          src={item.auction.images[0]}
                          alt={item.auction.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Gavel className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Badge 
                        className="absolute top-2 right-2"
                        variant={isEndingSoon ? "destructive" : getStatusColor(item.auction.status)}
                      >
                        {isEndingSoon ? "Ending Soon" : getStatusText(item.auction.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemove(item.auctionId)}
                        disabled={removing === item.auctionId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="line-clamp-1 text-base">
                        <Link href={`/auctions/${item.auction.id}`} className="hover:text-primary transition-colors">
                          {item.auction.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Added {formatRelativeTime(new Date(item.createdAt))}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{formatCurrency(item.auction.currentPrice)}</div>
                            <div className="text-xs text-muted-foreground">Current bid</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Gavel className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{item.auction._count.bids}</div>
                            <div className="text-xs text-muted-foreground">Bids</div>
                          </div>
                        </div>
                      </div>

                      {/* Time and Buy Now */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeRemaining(item.auction.endTime)}</span>
                        </div>
                        {item.auction.buyNowPrice && (
                          <span className="text-green-600 font-medium">
                            Buy Now: {formatCurrency(item.auction.buyNowPrice)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/auctions/${item.auction.id}`}>
                            <Gavel className="h-4 w-4 mr-1" />
                            Bid Now
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/auctions/${item.auction.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items in watchlist</h3>
              <p className="text-muted-foreground mb-6">
                Start watching auctions to see them here. Click the heart icon on any auction.
              </p>
              <Button asChild>
                <Link href="/auctions">Browse Auctions</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Ended */}
      {endedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recently Ended
            </CardTitle>
            <CardDescription>
              Auctions that have recently ended
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    {item.auction.images.length > 0 ? (
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.auction.images[0]}
                          alt={item.auction.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Gavel className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        <Link href={`/auctions/${item.auction.id}`} className="hover:text-primary transition-colors">
                          {item.auction.title}
                        </Link>
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Final price: {formatCurrency(item.auction.currentPrice)}</span>
                        <span>{item.auction._count.bids} bids</span>
                        <span>Ended {formatRelativeTime(new Date(item.auction.endTime))}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">
                      {getStatusText(item.auction.status)}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/auctions/${item.auction.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemove(item.auctionId)}
                      disabled={removing === item.auctionId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

