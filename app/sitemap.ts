import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { AuctionStatus } from '@prisma/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bidmaster.university'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/auctions`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Fetch active auctions for dynamic sitemap entries
    const activeAuctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000, // Limit to prevent sitemap from being too large
    })

    const auctionPages: MetadataRoute.Sitemap = activeAuctions.map((auction) => ({
      url: `${baseUrl}/auctions/${auction.id}`,
      lastModified: auction.updatedAt,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...auctionPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  }
}

