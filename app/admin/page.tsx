import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAdminStats, getRecentActivity } from './actions'
import { AdminDashboardClient } from './admin-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const dbUser = await import('@/lib/db').then(m => m.db.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  }))

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [stats, activity] = await Promise.all([
    getAdminStats(),
    getRecentActivity()
  ])

  return <AdminDashboardClient stats={stats} activity={activity} />
}
