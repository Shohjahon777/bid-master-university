'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Clock, 
  DollarSign,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Gavel
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { AuctionCountdown } from '@/components/auction-countdown'
import { UserBid } from '@/lib/actions/dashboard'

interface MyBidsClientProps {
  activeBids: UserBid[]
  wonBids: UserBid[]
  lostBids: UserBid[]
}

export function MyBidsClient({ 
  activeBids, 
  wonBids, 
  lostBids 
}: MyBidsClientProps) {
  const [activeTab, setActiveTab] = useState('active')
  
  const getStatusBadge = (status: UserBid['status']) => {
    switch (status) {
      case 'winning':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <TrendingUp className="h-3 w-3 mr-1" />
            Winning
          </Badge>
        )
      case 'outbid':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <TrendingDown className="h-3 w-3 mr-1" />
            Outbid
          </Badge>
        )
      case 'won':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <Trophy className="h-3 w-3 mr-1" />
            Won
          </Badge>
        )
      case 'lost':
        return (
          <Badge variant="secondary">
            Lost
          </Badge>
        )
      default:
        return null
    }
  }
  
  const renderBidCard = (bid: UserBid) => {
    const isWinning = bid.status === 'winning'
    const isOutbid = bid.status === 'outbid'
    const hasImage = bid.auction.images.length > 0 && bid.auction.images[0]
    
    return (
      <div
        key={bid.id}
        className={`p-4 rounded-lg border transition-colors ${
          isWinning 
            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
            : isOutbid
            ? 'bg-red-50 border-red-200 hover:bg-red-100'
            : 'bg-card border-border hover:bg-accent'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Auction Image */}
          <Link href={`/auctions/${bid.auctionId}`} className="flex-shrink-0">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
              {hasImage ? (
                <Image
                  src={bid.auction.images[0]}
                  alt={bid.auction.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </Link>
          
          {/* Bid Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <Link href={`/auctions/${bid.auctionId}`}>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                    {bid.auction.title}
                  </h3>
                </Link>
              </div>
              {getStatusBadge(bid.status)}
            </div>
            
            <div className="space-y-2">
              {/* Bid Amounts */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Your bid:</span>
                  <span className="font-semibold">{formatCurrency(bid.amount)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Current:</span>
                  <span className={`font-semibold ${isWinning ? 'text-green-700' : ''}`}>
                    {formatCurrency(bid.auction.currentPrice)}
                  </span>
                </div>
              </div>
              
              {/* Time Remaining / Status */}
              {(bid.status === 'winning' || bid.status === 'outbid') && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <AuctionCountdown 
                    endTime={bid.auction.endTime} 
                    className="text-sm"
                  />
                </div>
              )}
              
              {/* Won/Lost Status */}
              {bid.status === 'won' && (
                <div className="text-sm text-green-700 font-medium">
                  <Trophy className="h-4 w-4 inline mr-1" />
                  Congratulations! You won this auction
                </div>
              )}
              
              {bid.status === 'lost' && (
                <div className="text-sm text-muted-foreground">
                  Auction ended - you didn&apos;t win this auction
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/auctions/${bid.auctionId}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Auction
                </Link>
              </Button>
              
              {isOutbid && (
                <Button size="sm" asChild>
                  <Link href={`/auctions/${bid.auctionId}`}>
                    Bid Again
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Calculate stats
  const totalBids = activeBids.length + wonBids.length + lostBids.length
  const totalBidAmount = [...activeBids, ...wonBids, ...lostBids].reduce(
    (sum, bid) => sum + bid.amount,
    0
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">My Bids</h2>
        <p className="text-muted-foreground">
          Track your bidding activity and manage your auction participation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{wonBids.length}</div>
                <div className="text-sm text-muted-foreground">Auctions Won</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalBidAmount)}</div>
                <div className="text-sm text-muted-foreground">Total Bid Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{activeBids.length}</div>
                <div className="text-sm text-muted-foreground">Active Bids</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            <Clock className="h-4 w-4 mr-2" />
            Active ({activeBids.length})
          </TabsTrigger>
          <TabsTrigger value="won">
            <Trophy className="h-4 w-4 mr-2" />
            Won ({wonBids.length})
          </TabsTrigger>
          <TabsTrigger value="lost">
            Lost ({lostBids.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Bids */}
        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Bids</CardTitle>
              <CardDescription>
                Auctions you&apos;re currently bidding on
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeBids.length > 0 ? (
                <div className="space-y-4">
                  {activeBids.map(bid => renderBidCard(bid))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active bids</h3>
                  <p className="text-muted-foreground mb-4">
                    Start bidding on auctions to see them here.
                  </p>
                  <Button asChild>
                    <Link href="/auctions">
                      Browse Auctions
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Won Bids */}
        <TabsContent value="won" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Won Auctions</CardTitle>
              <CardDescription>
                Auctions you successfully won
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wonBids.length > 0 ? (
                <div className="space-y-4">
                  {wonBids.map(bid => renderBidCard(bid))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No won auctions</h3>
                  <p className="text-muted-foreground">
                    Your won auctions will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lost Bids */}
        <TabsContent value="lost" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lost Auctions</CardTitle>
              <CardDescription>
                Auctions that ended where you didn&apos;t win
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lostBids.length > 0 ? (
                <div className="space-y-4">
                  {lostBids.map(bid => renderBidCard(bid))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No lost auctions</h3>
                  <p className="text-muted-foreground">
                    Your lost auctions will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

