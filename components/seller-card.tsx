'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'
import { getInitials } from '@/lib/utils'
import { Mail, Star, Shield } from 'lucide-react'

interface SellerCardProps {
  seller: Pick<User, 'id' | 'name' | 'avatar' | 'university' | 'verified'>
  auctionCount?: number
  className?: string
}

export function SellerCard({ seller, auctionCount, className }: SellerCardProps) {
  const handleContactSeller = () => {
    // For now, just show a placeholder
    // In the future, this could open a modal or redirect to a contact form
    window.open(`mailto:${seller.name}@university.edu?subject=Auction Inquiry`, '_blank')
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Seller Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={seller.avatar || undefined} />
            <AvatarFallback>
              {getInitials(seller.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">
                {seller.name}
              </h3>
              {seller.verified && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            {seller.university && (
              <p className="text-sm text-muted-foreground truncate">
                {seller.university}
              </p>
            )}
          </div>
        </div>

        {/* Seller Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {auctionCount !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{auctionCount} auction{auctionCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Contact Button */}
        <Button 
          onClick={handleContactSeller}
          variant="outline" 
          className="w-full"
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Seller
        </Button>

        {/* Trust Indicators */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• University verified seller</p>
          <p>• Secure payment processing</p>
          <p>• 24/7 customer support</p>
        </div>
      </CardContent>
    </Card>
  )
}
