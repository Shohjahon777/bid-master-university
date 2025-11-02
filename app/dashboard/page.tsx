import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/stats-card"
import { DashboardAuctionCard } from "@/components/dashboard-auction-card"
import { RecentBidsList } from "@/components/recent-bids-list"
import { EndingSoonList } from "@/components/ending-soon-list"
import { 
  Gavel, 
  Trophy, 
  Heart, 
  DollarSign, 
  Plus
} from "lucide-react"
import Link from "next/link"
import { 
  getDashboardStats, 
  getActiveAuctions, 
  getRecentBids, 
  getEndingSoonAuctions 
} from "@/lib/actions/dashboard"

export default async function DashboardPage() {
  // Fetch data in Server Component
  const [stats, activeAuctions, recentBids, endingSoon] = await Promise.all([
    getDashboardStats(),
    getActiveAuctions(4),
    getRecentBids(5),
    getEndingSoonAuctions(3)
  ])
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's what's happening with your auctions and bids.
          </p>
        </div>
        <Button asChild>
          <Link href="/auctions/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Auction
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Auctions"
          value={stats.activeAuctions}
          description="Auctions you're currently running"
          icon={Gavel}
          trend={{ value: "+2 from last month", isPositive: true }}
          href="/dashboard/auctions"
        />
        <StatsCard
          title="Total Bids Received"
          value={stats.totalBidsReceived}
          description="Bids placed across all auctions"
          icon={Trophy}
          trend={{ value: "+12 from last month", isPositive: true }}
        />
        <StatsCard
          title="Items Won"
          value={stats.itemsWon}
          description="Auctions you've won"
          icon={Heart}
          trend={{ value: "No change", isPositive: false }}
        />
        <StatsCard
          title="Total Earnings"
          value={`$${stats.totalEarnings.toLocaleString()}`}
          description="From completed auctions"
          icon={DollarSign}
          trend={{ value: "+15% from last month", isPositive: true }}
        />
      </div>

      {/* Main content sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Your Active Auctions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Gavel className="mr-2 h-5 w-5" />
                  Your Active Auctions
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/auctions">View All</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                Your latest auction listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAuctions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeAuctions.map((auction) => (
                    <DashboardAuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active auctions</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first auction to start selling items.
                  </p>
                  <Button asChild>
                    <Link href="/auctions/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Auction
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bids */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Your Recent Bids
              </CardTitle>
              <CardDescription>
                Your latest bidding activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentBidsList bids={recentBids} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ending Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Gavel className="mr-2 h-5 w-5" />
              Ending Soon
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auctions?filter=ending-soon">View All</Link>
            </Button>
          </CardTitle>
          <CardDescription>
            Auctions ending in the next 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EndingSoonList auctions={endingSoon} />
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/auctions/new">
                <Plus className="h-6 w-6 mb-2" />
                Create Auction
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/auctions">
                <Gavel className="h-6 w-6 mb-2" />
                Browse Auctions
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/watchlist">
                <Heart className="h-6 w-6 mb-2" />
                View Watchlist
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
