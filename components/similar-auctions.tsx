import { getAuctions } from '@/lib/actions/auctions'
import { AuctionCard } from '@/components/auction-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuctionWithRelations } from '@/types'
import type { SerializableAuction } from '@/lib/auctions'

interface SimilarAuctionsProps {
  currentAuctionId: string
  category: string
  className?: string
}

export async function SimilarAuctions({ 
  currentAuctionId, 
  category, 
  className 
}: SimilarAuctionsProps) {
  // Fetch similar auctions (same category, excluding current auction)
  const { auctions } = await getAuctions({
    category,
    limit: 6
  })

  // Filter out the current auction
  const similarAuctions = (auctions as (AuctionWithRelations | SerializableAuction)[]).filter(
    (auction) => auction.id !== currentAuctionId,
  )

  if (similarAuctions.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Similar Auctions</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {similarAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
