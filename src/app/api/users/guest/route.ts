import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/guest - Create a guest user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Create guest user
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        isGuest: true,
        name: username.trim()
      },
      select: {
        id: true,
        username: true,
        name: true,
        isGuest: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating guest user:', error)
    return NextResponse.json(
      { error: 'Failed to create guest user' },
      { status: 500 }
    )
  }
}
