import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Gavel, 
  Clock, 
  DollarSign,
  Eye,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface DashboardAuctionCardProps {
  auction: {
    id: string
    title: string
    currentBid: number
    bids: number
    timeLeft: string
    status: "active" | "ending"
    views: number
    imageUrl?: string
  }
}

export function DashboardAuctionCard({ auction }: DashboardAuctionCardProps) {
  const getStatusColor = (status: string) => {
    return status === "ending" ? "destructive" : "default"
  }

  const getStatusText = (status: string) => {
    return status === "ending" ? "Ending Soon" : "Active"
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-muted relative">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Gavel className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge 
          className="absolute top-2 right-2"
          variant={getStatusColor(auction.status)}
        >
          {getStatusText(auction.status)}
        </Badge>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1 text-base">{auction.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">${auction.currentBid}</div>
              <div className="text-xs text-muted-foreground">Current bid</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Gavel className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{auction.bids}</div>
              <div className="text-xs text-muted-foreground">Bids</div>
            </div>
          </div>
        </div>

        {/* Time and views */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{auction.timeLeft}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{auction.views}</span>
          </div>
        </div>

        {/* Action button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/auctions/${auction.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
