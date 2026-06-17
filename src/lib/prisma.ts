// Run `npx prisma generate` then `npx prisma db push` after adding DATABASE_URL

const globalForPrisma = globalThis as unknown as { prisma: unknown }

function getPrismaClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })
  } catch {
    return null
  }
}

export const prisma = (globalForPrisma.prisma as ReturnType<typeof getPrismaClient>) ?? getPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
