import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUsers } from './actions'
import { UsersManagementClient } from './users-management-client'

interface UsersPageProps {
  searchParams: {
    search?: string
    status?: string
    university?: string
    page?: string
    sortBy?: string
    sortOrder?: string
  }
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

  const usersData = await getUsers({
    search: searchParams.search,
    status: searchParams.status as any,
    university: searchParams.university,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 50,
    sortBy: (searchParams.sortBy as any) || 'createdAt',
    sortOrder: (searchParams.sortOrder as any) || 'desc'
  })

  return <UsersManagementClient initialData={usersData} />
}
