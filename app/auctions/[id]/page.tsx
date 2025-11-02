import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getAuctionById } from '@/lib/actions/auctions'
import { ImageCarousel } from '@/components/image-carousel'
import { SellerCard } from '@/components/seller-card'
import { BidForm } from '@/components/bid-form'
import { BidHistory } from '@/components/bid-history'
import { AuctionCountdown } from '@/components/auction-countdown'
import { SimilarAuctions } from '@/components/similar-auctions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getAuctionStatusText, isAuctionActive, isAuctionEnded } from '@/lib/utils'
import { AuctionWithRelations } from '@/types'
import { ArrowLeft, Share2, Heart } from 'lucide-react'
import Link from 'next/link'

interface AuctionDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: AuctionDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const auction = await getAuctionById(id)
  
  if (!auction) {
    return {
      title: 'Auction Not Found',
    }
  }

  return {
    title: `${auction.title} - Bid Master University`,
    description: auction.description,
    openGraph: {
      title: auction.title,
      description: auction.description,
      images: auction.images.length > 0 ? [auction.images[0]] : [],
      type: 'website',
    },
  }
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params
  const auction = await getAuctionById(id)

  if (!auction) {
    notFound()
  }

  const currentPrice = Number(auction.currentPrice)
  const startingPrice = Number(auction.startingPrice)
  const buyNowPrice = auction.buyNowPrice ? Number(auction.buyNowPrice) : null
  const bidCount = auction._count?.bids || 0
  const isActive = isAuctionActive(auction)
  const isEnded = isAuctionEnded(auction)
  const statusText = getAuctionStatusText(auction)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ELECTRONICS: 'bg-blue-100 text-blue-800 border-blue-200',
      CLOTHING: 'bg-pink-100 text-pink-800 border-pink-200',
      BOOKS: 'bg-green-100 text-green-800 border-green-200',
      FURNITURE: 'bg-amber-100 text-amber-800 border-amber-200',
      SPORTS: 'bg-orange-100 text-orange-800 border-orange-200',
      JEWELRY: 'bg-purple-100 text-purple-800 border-purple-200',
      ART: 'bg-red-100 text-red-800 border-red-200',
      COLLECTIBLES: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      VEHICLES: 'bg-gray-100 text-gray-800 border-gray-200',
      OTHER: 'bg-slate-100 text-slate-800 border-slate-200'
    }
    return colors[category] || colors.OTHER
  }

  const getConditionColor = (condition: string) => {
    const conditions: Record<string, string> = {
      'New': 'bg-green-100 text-green-800 border-green-200',
      'Like New': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Good': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Fair': 'bg-orange-100 text-orange-800 border-orange-200',
      'Poor': 'bg-red-100 text-red-800 border-red-200'
    }
    return conditions[condition] || conditions['Good']
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/auctions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image Carousel */}
          <ImageCarousel 
            images={auction.images} 
            title={auction.title}
            className="w-full"
          />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {auction.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Card */}
          <SellerCard 
            seller={auction.user}
            auctionCount={undefined} // Could be fetched separately if needed
          />
        </div>

        {/* Right Column - 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auction Info Card */}
          <Card>
            <CardHeader className="space-y-4">
              {/* Title */}
              <CardTitle className="text-2xl leading-tight">
                {auction.title}
              </CardTitle>

              {/* Category and Condition Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  className={`${getCategoryColor(auction.category)} border`}
                  variant="outline"
                >
                  {auction.category}
                </Badge>
                <Badge 
                  className={`${getConditionColor(auction.condition)} border`}
                  variant="outline"
                >
                  {auction.condition}
                </Badge>
                <Badge 
                  variant={isActive ? 'default' : isEnded ? 'secondary' : 'destructive'}
                  className="font-medium"
                >
                  {statusText}
                </Badge>
              </div>

              {/* Current Price */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {formatCurrency(currentPrice)}
                </div>
                {currentPrice > startingPrice && (
                  <div className="text-sm text-muted-foreground">
                    Started at <span className="line-through">{formatCurrency(startingPrice)}</span>
                  </div>
                )}
              </div>

              {/* Time Remaining */}
              <div className="text-center">
                <AuctionCountdown endTime={auction.endTime} />
              </div>

              {/* Bid Count */}
              <div className="text-center">
                <Badge variant="outline" className="text-sm">
                  {bidCount} bid{bidCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Buy Now Price */}
              {buyNowPrice && isActive && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Or buy now for</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(buyNowPrice)}
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Heart className="w-4 h-4 mr-2" />
                  Watch
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bid Form */}
          <BidForm 
            auction={auction}
          />

          {/* Bid History */}
          <BidHistory 
            auctionId={auction.id}
            initialBids={auction.bids}
            currentUserId={undefined} // Will be passed from auth context
          />
        </div>
      </div>

      {/* Similar Auctions */}
      <div className="mt-12">
        <SimilarAuctions 
          currentAuctionId={auction.id}
          category={auction.category}
        />
      </div>
    </div>
  )
}
