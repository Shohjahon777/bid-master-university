import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Gavel, 
  Trophy, 
  Shield, 
  Users, 
  Clock,
  DollarSign,
  CheckCircle
} from "lucide-react"

export const runtime = 'edge'
export const revalidate = 86400

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "Browse Auctions",
      description: "Discover amazing items from fellow students across your university campus.",
      details: "Search by category, price range, or keywords to find exactly what you're looking for."
    },
    {
      icon: Gavel,
      title: "Place Your Bid",
      description: "Bid on items you want with our simple and secure bidding system.",
      details: "Set your maximum bid and let our system automatically bid for you up to that amount."
    },
    {
      icon: Trophy,
      title: "Win & Collect",
      description: "If you're the highest bidder when the auction ends, you win the item!",
      details: "Arrange pickup or delivery with the seller to complete your purchase."
    }
  ]

  const features = [
    {
      icon: Shield,
      title: "University Verified",
      description: "Only verified university students and staff can participate in auctions."
    },
    {
      icon: Users,
      title: "Campus Community",
      description: "Connect with fellow students in a trusted, internal marketplace."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications when you're outbid or when auctions end."
    },
    {
      icon: DollarSign,
      title: "Fair Pricing",
      description: "No hidden fees or commissions. What you bid is what you pay."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              University Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              How Bid Master Works
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Learn how to buy and sell items through our secure university auction platform.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Simple 3-Step Process</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <Card key={step.title} className="text-center">
                    <CardHeader>
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex items-center justify-center mb-2">
                        <Badge variant="outline" className="mr-2">Step {index + 1}</Badge>
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="text-base">
                        {step.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {step.details}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Bid Master?</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join your university's auction community today and start discovering amazing items from fellow students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auctions"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                Browse Auctions
              </a>
              <a
                href="/auctions/new"
                className="inline-flex items-center justify-center px-6 py-3 border border-input text-base font-medium rounded-md text-foreground bg-background hover:bg-accent transition-colors"
              >
                Create Auction
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
