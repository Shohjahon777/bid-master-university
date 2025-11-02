import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <Skeleton className="h-4 w-24" />
        </CardTitle>
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          <Skeleton className="h-8 w-20" />
        </div>
        <p className="text-xs text-muted-foreground">
          <Skeleton className="h-3 w-32 mt-2" />
        </p>
      </CardContent>
    </Card>
  )
}

function DashboardAuctionCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

function RecentBidSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Your Active Auctions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-20" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-32" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <DashboardAuctionCardSkeleton key={i} />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bids */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-40" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <RecentBidSkeleton key={i} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ending Soon */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-36" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
