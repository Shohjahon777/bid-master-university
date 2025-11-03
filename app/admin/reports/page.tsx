import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getReports } from './actions'
import { ReportsClient } from './reports-client'

export const dynamic = 'force-dynamic'

interface ReportsPageProps {
  searchParams: Promise<{
    status?: string
  }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
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

  const params = await searchParams
  const reports = await getReports(params.status as any)

  return <ReportsClient initialReports={reports} />
}
