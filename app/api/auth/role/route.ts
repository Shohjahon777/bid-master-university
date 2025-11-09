'use server'

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await requireAuth()

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ role: null }, { status: 404 })
    }

    return NextResponse.json({ role: dbUser.role })
  } catch (error) {
    console.error('Error retrieving user role:', error)
    return NextResponse.json({ role: null }, { status: 401 })
  }
}


