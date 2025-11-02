import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gavel, Users, TrendingUp, Shield, Clock, Zap, CheckCircle, ArrowRight, Star } from "lucide-react";
import { AuctionCard } from "@/components/auction-card";
import { getRecentAuctions } from "@/lib/auctions";

// Loading component for recent auctions
function RecentAuctionsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-video bg-muted" />
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <div className="w-full space-y-3">
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Recent auctions section component
async function RecentAuctionsSection() {
  const auctions = await getRecentAuctions(6);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Recent Auctions
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover the latest items up for auction in your campus community
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/auctions" className="flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {auctions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gavel className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No active auctions</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to list an item and start the bidding!
            </p>
            <Button asChild>
              <Link href="/auctions/new">Create First Auction</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              University Internal Platform
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Buy & Sell Within{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Your Campus
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              The internal university auction platform where students can list items, 
              discover unique finds, and bid on exciting auctions within your campus community.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/auctions">Browse Auctions</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              Why Choose Bid Master?
            </h2>
            <p className="text-lg text-muted-foreground">
              Built specifically for university communities with safety and convenience in mind.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Safe & Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  University email verification ensures all users are legitimate students and faculty members.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <Zap className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Real-time Bidding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get instant notifications when you're outbid and watch live auction updates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                  <Gavel className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Easy to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Simple listing process and intuitive bidding system designed for students.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Auctions Section */}
      <Suspense fallback={<RecentAuctionsLoading />}>
        <RecentAuctionsSection />
      </Suspense>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center p-6 relative">
              <CardHeader className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary relative">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <CardTitle className="text-2xl">List Your Item</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Upload photos, set a starting price, and describe your item. Choose how long the auction should run.
                </CardDescription>
              </CardContent>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </Card>

            <Card className="text-center p-6 relative">
              <CardHeader className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary relative">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <CardTitle className="text-2xl">Wait for Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Students browse and place bids on your item. You'll get notifications for each new bid.
                </CardDescription>
              </CardContent>
              <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </Card>

            <Card className="text-center p-6">
              <CardHeader className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary relative">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <CardTitle className="text-2xl">Sell to Highest Bidder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  When the auction ends, arrange a safe meeting with the winning bidder to complete the sale.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
            Join your university's auction community today and start discovering amazing items from fellow students.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/auctions">Browse Auctions</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auctions/new">Create Auction</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}