import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  console.error('For production (Vercel), set it in: Settings > Environment Variables')
  console.error('For development, check your .env.local file')
  throw new Error('DATABASE_URL environment variable is missing')
}

console.log('🔧 Initializing Prisma Client...')
console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')) // Hide password

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

console.log('✅ Prisma Client initialized')

// Prisma will connect automatically when needed
// Don't call $connect() here as it can fail during module initialization
