import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        envVars: {
          DATABASE_URL: 'NOT SET',
          DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
        }
      }, { status: 500 })
    }
    
    // Test connection
    await db.$connect()
    console.log('✅ Database connection successful')
    
    // Count tables
    const auctionCount = await db.auction.count()
    const userCount = await db.user.count()
    const bidCount = await db.bid.count()
    
    console.log(`📊 Database stats: ${auctionCount} auctions, ${userCount} users, ${bidCount} bids`)
    
    // Get sample auction data
    const sampleAuctions = await db.auction.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      stats: {
        auctions: auctionCount,
        users: userCount,
        bids: bidCount
      },
      sampleAuctions,
      envVars: {
        DATABASE_URL: 'SET (hidden)',
        DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
      }
    })
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      envVars: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
        DIRECT_URL: process.env.DIRECT_URL ? 'SET' : 'NOT SET',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
      }
    }, { status: 500 })
  }
}

