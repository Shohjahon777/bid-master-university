'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/stats-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Users,
  Gavel,
  DollarSign,
  TrendingUp,
  FileText,
  Shield,
  Eye
} from 'lucide-react'
import { formatRelativeTime, formatCurrency, getInitials } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number
    userGrowth: number
    totalAuctions: number
    activeAuctions: number
    endedAuctions: number
    totalRevenue: number
    auctionsCreatedToday: number
    usersRegisteredToday: number
    auctionsByCategory: Array<{ category: string; count: number }>
    revenueByMonth: Array<{ month: string; revenue: number }>
    auctionsOverTime: Array<{ date: string; count: number }>
  }
  activity: {
    recentUsers: Array<{
      id: string
      name: string
      email: string
      avatar: string | null
      university: string | null
      createdAt: string
    }>
    recentAuctions: Array<{
      id: string
      title: string
      status: string
      currentPrice: number
      createdAt: string
      user: {
        id: string
        name: string
        avatar: string | null
      }
    }>
    recentBids: Array<{
      id: string
      amount: number
      createdAt: string
      user: {
        id: string
        name: string
        avatar: string | null
      }
      auction: {
        id: string
        title: string
      }
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AdminDashboardClient({ stats, activity }: AdminDashboardClientProps) {
  const router = useRouter()

  // Prepare data for charts
  const auctionsOverTimeData = stats.auctionsOverTime.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count
  }))

  const categoryData = stats.auctionsByCategory.map(item => ({
    name: item.category,
    value: item.count
  }))

  const revenueData = stats.revenueByMonth.map(item => ({
    month: item.month,
    revenue: item.revenue
  }))

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of platform statistics and activity</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/reports">
              <FileText className="h-4 w-4 mr-2" />
              Review Reports
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              View All Users
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          description={`${stats.usersRegisteredToday} registered today`}
          icon={Users}
          trend={{
            value: `${stats.userGrowth > 0 ? '+' : ''}${stats.userGrowth.toFixed(1)}%`,
            isPositive: stats.userGrowth >= 0
          }}
          href="/admin/users"
        />
        <StatsCard
          title="Total Auctions"
          value={stats.totalAuctions.toLocaleString()}
          description={`${stats.activeAuctions} active, ${stats.endedAuctions} ended`}
          icon={Gavel}
          trend={{
            value: `${stats.auctionsCreatedToday} today`,
            isPositive: true
          }}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description={`From ${stats.endedAuctions} completed auctions`}
          icon={DollarSign}
        />
        <StatsCard
          title="Active Auctions"
          value={stats.activeAuctions.toLocaleString()}
          description="Currently running"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Auctions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Auctions Created Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={auctionsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props
                    return `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Month */}
      {revenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(user.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Auctions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Auctions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.recentAuctions.map((auction) => (
                <div key={auction.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm line-clamp-2">{auction.title}</p>
                    <Badge variant={auction.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {auction.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={auction.user.avatar || undefined} alt={auction.user.name} />
                      <AvatarFallback>{getInitials(auction.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{auction.user.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(auction.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bids */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.recentBids.map((bid) => (
                <div key={bid.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{formatCurrency(bid.amount)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(bid.createdAt))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={bid.user.avatar || undefined} alt={bid.user.name} />
                      <AvatarFallback>{getInitials(bid.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{bid.user.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{bid.auction.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
