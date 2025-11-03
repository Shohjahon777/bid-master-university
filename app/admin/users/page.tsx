import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUsers } from './actions'
import { UsersManagementClient } from './users-management-client'

export const dynamic = 'force-dynamic'

interface UsersPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    university?: string
    page?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function UsersManagementPage({ searchParams }: UsersPageProps) {
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
  const usersData = await getUsers({
    search: params.search,
    status: params.status as any,
    university: params.university,
    page: params.page ? parseInt(params.page) : 1,
    limit: 50,
    sortBy: (params.sortBy as any) || 'createdAt',
    sortOrder: (params.sortOrder as any) || 'desc'
  })

  return <UsersManagementClient initialData={usersData} />
}
