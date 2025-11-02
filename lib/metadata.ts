import { Metadata } from 'next'
import { AuctionWithRelations } from '@/types'
import { formatCurrency } from './utils'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bidmaster.university'
const siteName = 'Bid Master University'

/**
 * Generate metadata for auction detail pages
 */
export function generateAuctionMetadata(auction: AuctionWithRelations): Metadata {
  const title = `${auction.title} - Bid Master`
  const description = auction.description
    ? auction.description.slice(0, 160).trim() + (auction.description.length > 160 ? '...' : '')
    : `View auction for ${auction.title} on Bid Master University`
  
  const currentPrice = Number(auction.currentPrice)
  const ogImage = auction.images.length > 0 ? auction.images[0] : `${baseUrl}/og-image.png`
  const auctionUrl = `${baseUrl}/auctions/${auction.id}`
  
  return {
    title,
    description,
    openGraph: {
      title: auction.title,
      description,
      url: auctionUrl,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: auction.title,
        },
      ],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: auction.title,
      description,
      images: [ogImage],
      creator: '@bidmaster',
    },
    alternates: {
      canonical: auctionUrl,
    },
    other: {
      'auction:price': currentPrice.toString(),
      'auction:currency': 'USD',
      'auction:availability': auction.status === 'ACTIVE' ? 'in stock' : 'out of stock',
    },
  }
}

/**
 * Generate metadata for user profile pages
 */
export function generateProfileMetadata(
  user: { name: string; university?: string | null; avatar?: string | null }
): Metadata {
  const title = `${user.name}'s Profile - Bid Master`
  const description = user.university
    ? `View ${user.name}'s profile on Bid Master. Member of ${user.university}.`
    : `View ${user.name}'s profile on Bid Master University`
  
  const profileUrl = `${baseUrl}/profile/${user.name.toLowerCase().replace(/\s+/g, '-')}`
  const ogImage = user.avatar || `${baseUrl}/og-image.png`
  
  return {
    title,
    description,
    openGraph: {
      title: `${user.name}'s Profile`,
      description,
      url: profileUrl,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${user.name}'s Profile`,
        },
      ],
      type: 'profile',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary',
      title: `${user.name}'s Profile`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: profileUrl,
    },
  }
}

/**
 * Generate structured data for LocalBusiness (homepage)
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Bid Master University',
    description: 'Internal university auction platform where students can list items and bid on auctions',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      // Add social media links if available
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@bidmaster.edu',
    },
    priceRange: '$$',
    serviceArea: {
      '@type': 'EducationalOrganization',
      name: 'University Campus',
    },
  }
}

/**
 * Generate structured data for Product (auction)
 */
export function generateProductSchema(auction: AuctionWithRelations) {
  const currentPrice = Number(auction.currentPrice)
  const startingPrice = Number(auction.startingPrice)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: auction.title,
    description: auction.description || '',
    image: auction.images,
    category: auction.category,
    brand: {
      '@type': 'Brand',
      name: auction.user.name,
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/auctions/${auction.id}`,
      priceCurrency: 'USD',
      price: currentPrice,
      priceValidUntil: auction.endTime.toISOString(),
      availability: auction.status === 'ACTIVE' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Person',
        name: auction.user.name,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5', // Could be calculated from reviews
      reviewCount: auction._count?.bids || 0,
    },
  }
}

/**
 * Default metadata for pages
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Bid Master University',
    template: '%s | Bid Master',
  },
  description: 'Internal university auction platform where students can list items and bid on auctions',
  keywords: ['auction', 'university', 'bidding', 'student', 'marketplace', 'campus'],
  authors: [{ name: 'Bid Master Team' }],
  creator: 'Bid Master',
  publisher: 'Bid Master University',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName,
    title: 'Bid Master - University Auction Platform',
    description: 'Internal university auction platform where students can list items and bid on auctions',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Bid Master University',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bid Master - University Auction Platform',
    description: 'Internal university auction platform where students can list items and bid on auctions',
    images: [`${baseUrl}/og-image.png`],
    creator: '@bidmaster',
  },
  robots: {
    index: false, // Internal platform, don't index by default
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

