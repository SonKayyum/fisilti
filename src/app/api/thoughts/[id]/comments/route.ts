import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/thoughts/[id]/comments - Get comments for a thought
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const comments = await prisma.comment.findMany({
      where: {
        thoughtId: id
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            isGuest: true
          }
        }
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/thoughts/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, authorId } = body

    if (!content || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if thought exists
    const thought = await prisma.thought.findUnique({
      where: { id }
    })

    if (!thought) {
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        thoughtId: id
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            isGuest: true
          }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
