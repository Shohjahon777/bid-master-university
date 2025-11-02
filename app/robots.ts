import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bidmaster.university'

  // For internal university platform, we might want to restrict indexing
  // Change this based on your requirements
  const allowIndexing = process.env.ALLOW_SEARCH_ENGINE_INDEXING === 'true'

  if (allowIndexing) {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/dashboard',
            '/admin',
            '/api',
            '/messages',
            '/profile',
            '/settings',
          ],
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    }
  } else {
    // Block all indexing for internal platform
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    }
  }
}

