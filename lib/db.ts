import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  throw new Error('DATABASE_URL environment variable is missing')
}

// Optimized Prisma Client configuration
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    // Connection pool settings for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Optimize connection pooling
if (process.env.NODE_ENV === 'production') {
  // Set connection pool size
  db.$connect().then(() => {
  }).catch((err) => {
    console.error('❌ Database connection failed:', err)
  })
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})

export default db