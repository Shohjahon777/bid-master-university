import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  DollarSign,
  Gavel,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface EndingSoonAuction {
  id: string
  title: string
  currentBid: number
  timeLeft: string
  bids: number
  imageUrl?: string
}

interface EndingSoonListProps {
  auctions: EndingSoonAuction[]
  showViewAll?: boolean
}

export function EndingSoonList({ auctions, showViewAll = true }: EndingSoonListProps) {
  if (auctions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No auctions ending soon</h3>
        <p className="text-muted-foreground mb-4">
          Check back later for auctions ending in the next 24 hours.
        </p>
        <Button asChild>
          <Link href="/auctions">Browse Auctions</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {auctions.map((auction) => (
        <div key={auction.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {auction.imageUrl ? (
                <Image
                  src={auction.imageUrl}
                  alt={auction.title}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
              ) : (
                <Gavel className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{auction.title}</h4>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${auction.currentBid}
                </span>
                <span className="flex items-center">
                  <Gavel className="h-3 w-3 mr-1" />
                  {auction.bids} bids
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">{auction.timeLeft}</span>
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/auctions/${auction.id}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
      
      {showViewAll && (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/auctions?filter=ending-soon">
            View All Ending Soon
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
