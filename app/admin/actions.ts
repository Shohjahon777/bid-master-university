'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { UserRole, UserStatus, ReportStatus, ReportType } from '@prisma/client'
import { Prisma } from '@prisma/client'

// Admin Dashboard Stats
export async function getAdminStats() {
  await requireAdmin()

  const [
    totalUsers,
    totalAuctions,
    activeAuctions,
    endedAuctions,
    totalRevenue,
    auctionsCreatedToday,
    usersRegisteredToday,
    auctionsByCategory,
    revenueByMonth
  ] = await Promise.all([
    // Total users
    db.user.count(),
    
    // Total auctions
    db.auction.count(),
    
    // Active auctions
    db.auction.count({
      where: { status: 'ACTIVE' }
    }),
    
    // Ended auctions
    db.auction.count({
      where: { status: 'ENDED' }
    }),
    
    // Total revenue (sum of ended auctions' currentPrice)
    db.auction.aggregate({
      where: { status: 'ENDED' },
      _sum: { currentPrice: true }
    }),
    
    // Auctions created today
    db.auction.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    
    // Users registered today
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    
    // Auctions by category
    db.auction.groupBy({
      by: ['category'],
      _count: { category: true }
    }),
    
    // Revenue by month (last 12 months)
    db.auction.groupBy({
      by: ['createdAt'],
      where: {
        status: 'ENDED',
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      },
      _sum: { currentPrice: true }
    })
  ])

  // Calculate user growth (users in last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const usersLast30Days = await db.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } }
  })

  const usersPrevious30Days = await db.user.count({
    where: {
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo
      }
    }
  })

  const userGrowth = usersPrevious30Days > 0
    ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100
    : 0

  // Process revenue by month
  const monthlyRevenue = revenueByMonth.reduce((acc, item) => {
    const month = new Date(item.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
    const revenue = item._sum.currentPrice ? Number(item._sum.currentPrice) : 0
    acc[month] = (acc[month] || 0) + revenue
    return acc
  }, {} as Record<string, number>)

  // Auctions created over time (last 30 days)
  const thirtyDaysAgoDate = new Date()
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30)

  const auctionsOverTime = await db.auction.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgoDate }
    },
    select: {
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Group by date
  const auctionsByDate = auctionsOverTime.reduce((acc, auction) => {
    const date = new Date(auction.createdAt).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalUsers,
    userGrowth: Math.round(userGrowth * 100) / 100,
    totalAuctions,
    activeAuctions,
    endedAuctions,
    totalRevenue: totalRevenue._sum.currentPrice ? Number(totalRevenue._sum.currentPrice) : 0,
    auctionsCreatedToday,
    usersRegisteredToday,
    auctionsByCategory: auctionsByCategory.map(item => ({
      category: item.category,
      count: item._count.category
    })),
    revenueByMonth: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    })),
    auctionsOverTime: Object.entries(auctionsByDate).map(([date, count]) => ({
      date,
      count
    }))
  }
}

// Get recent activity
export async function getRecentActivity() {
  await requireAdmin()

  const [recentUsers, recentAuctions, recentBids] = await Promise.all([
    db.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        university: true,
        createdAt: true
      }
    }),
    db.auction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    }),
    db.bid.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        auction: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })
  ])

  return {
    recentUsers: recentUsers.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString()
    })),
    recentAuctions: recentAuctions.map(auction => ({
      ...auction,
      createdAt: auction.createdAt.toISOString(),
      currentPrice: Number(auction.currentPrice)
    })),
    recentBids: recentBids.map(bid => ({
      ...bid,
      createdAt: bid.createdAt.toISOString(),
      amount: Number(bid.amount)
    }))
  }
}

// User Management Actions
export async function getUsers(params: {
  search?: string
  status?: UserStatus
  university?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}) {
  await requireAdmin()

  const {
    search = '',
    status,
    university,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params

  const where: Prisma.UserWhereInput = {
    role: 'USER' // Only get regular users, not admins
  }

  if (status) {
    where.status = status
  }

  if (university) {
    where.university = university
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        university: true,
        verified: true,
        status: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspendedReason: true,
        bannedAt: true,
        bannedUntil: true,
        bannedReason: true,
        createdAt: true
      }
    }),
    db.user.count({ where })
  ])

  const universities = await db.user.findMany({
    where: { role: 'USER' },
    select: { university: true },
    distinct: ['university']
  })

  return {
    users: users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      suspendedAt: user.suspendedAt?.toISOString() || null,
      suspendedUntil: user.suspendedUntil?.toISOString() || null,
      bannedAt: user.bannedAt?.toISOString() || null,
      bannedUntil: user.bannedUntil?.toISOString() || null
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    universities: universities
      .map(u => u.university)
      .filter((u): u is string => u !== null)
  }
}

export async function suspendUser(userId: string, reason: string, durationDays?: number) {
  await requireAdmin()

  const suspendedUntil = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.SUSPENDED,
      suspendedAt: new Date(),
      suspendedUntil,
      suspendedReason: reason
    }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function banUser(userId: string, reason: string, durationDays?: number) {
  await requireAdmin()

  const bannedUntil = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.BANNED,
      bannedAt: new Date(),
      bannedUntil,
      bannedReason: reason
    }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireAdmin()

  // Check if user is admin
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role === 'ADMIN') {
    return { success: false, error: 'Cannot delete admin user' }
  }

  await db.user.delete({
    where: { id: userId }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function unsuspendUser(userId: string) {
  await requireAdmin()

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      suspendedAt: null,
      suspendedUntil: null,
      suspendedReason: null
    }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function unbanUser(userId: string) {
  await requireAdmin()

  await db.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      bannedAt: null,
      bannedUntil: null,
      bannedReason: null
    }
  })

  revalidatePath('/admin/users')
  return { success: true }
}

// Reports Management Actions
export async function getReports(status?: ReportStatus) {
  await requireAdmin()

  const where: Prisma.ReportWhereInput = {}
  if (status) {
    where.status = status
  }

  const reports = await db.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      target: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      }
    }
  })

  return reports.map(report => ({
    ...report,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt?.toISOString() || null,
    updatedAt: report.updatedAt.toISOString()
  }))
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  await requireAdmin()
  const admin = await requireAdmin()

  await db.report.update({
    where: { id: reportId },
    data: {
      status,
      resolvedAt: status === 'RESOLVED' ? new Date() : null,
      resolvedBy: status === 'RESOLVED' ? admin.id : null
    }
  })

  revalidatePath('/admin/reports')
  return { success: true }
}

export async function resolveReport(
  reportId: string,
  action: 'DELETE_CONTENT' | 'SUSPEND_USER' | 'WARN_USER' | 'DISMISS',
  reason: string,
  durationDays?: number
) {
  await requireAdmin()
  const admin = await requireAdmin()

  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      target: true
    }
  })

  if (!report) {
    return { success: false, error: 'Report not found' }
  }

  await db.$transaction(async (tx) => {
    // Update report
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: admin.id,
        action
      }
    })

    // Execute action based on type
    if (action === 'SUSPEND_USER') {
      const suspendedUntil = durationDays
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        : null

      await tx.user.update({
        where: { id: report.targetId },
        data: {
          status: UserStatus.SUSPENDED,
          suspendedAt: new Date(),
          suspendedUntil,
          suspendedReason: reason
        }
      })
    } else if (action === 'DELETE_CONTENT') {
      if (report.type === 'AUCTION') {
        await tx.auction.delete({
          where: { id: report.targetId }
        })
      } else if (report.type === 'MESSAGE') {
        await tx.message.delete({
          where: { id: report.targetId }
        })
      }
    }
  })

  revalidatePath('/admin/reports')
  return { success: true }
}
