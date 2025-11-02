import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface RecentBid {
  id: string
  auctionTitle: string
  auctionId: string
  bidAmount: number
  status: "winning" | "outbid" | "won"
  timeAgo: string
  auctionImageUrl?: string
}

interface RecentBidsListProps {
  bids: RecentBid[]
  showViewAll?: boolean
}

export function RecentBidsList({ bids, showViewAll = true }: RecentBidsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "winning":
        return "default"
      case "outbid":
        return "secondary"
      case "won":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "winning":
        return "Winning"
      case "outbid":
        return "Outbid"
      case "won":
        return "Won"
      default:
        return "Unknown"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "winning":
        return <TrendingUp className="h-4 w-4" />
      case "outbid":
        return <TrendingDown className="h-4 w-4" />
      case "won":
        return <Trophy className="h-4 w-4" />
      default:
        return null
    }
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No recent bids</h3>
        <p className="text-muted-foreground mb-4">
          Start bidding on auctions to see them here.
        </p>
        <Button asChild>
          <Link href="/auctions">Browse Auctions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => (
        <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {bid.auctionImageUrl ? (
                <Image
                  src={bid.auctionImageUrl}
                  alt={bid.auctionTitle}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <Trophy className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{bid.auctionTitle}</h4>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className="font-medium">${bid.bidAmount}</span>
                <span>•</span>
                <span>{bid.timeAgo}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={getStatusColor(bid.status)}
              className="flex items-center space-x-1"
            >
              {getStatusIcon(bid.status)}
              <span className="hidden sm:inline">{getStatusText(bid.status)}</span>
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/auctions/${bid.auctionId}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
      
      {showViewAll && (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/bids">
            View All Bids
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
