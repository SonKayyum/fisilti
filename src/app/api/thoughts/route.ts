import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/thoughts - Get thoughts based on location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '10') // km
    const limit = parseInt(searchParams.get('limit') || '20')

    // If no location provided, get all thoughts
    if (lat === 0 && lng === 0) {
      const thoughts = await prisma.thought.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              isGuest: true
            }
          },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
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
          },
          _count: {
            select: {
              comments: true
            }
          }
        }
      })

      // Ensure distance exists for UI; use a neutral default (1000m)
      const shaped = thoughts.map(t => ({ ...t, distance: 1000 }))
      return NextResponse.json(shaped)
    }

    // Calculate distance using Haversine formula
    // For now, we'll use a simple bounding box approach
    // In production, you might want to use PostGIS or similar
    const latRange = radius / 111 // Rough conversion: 1 degree ≈ 111 km
    const lngRange = radius / (111 * Math.cos(lat * Math.PI / 180))

    const thoughts = await prisma.thought.findMany({
      where: {
        latitude: {
          gte: lat - latRange,
          lte: lat + latRange
        },
        longitude: {
          gte: lng - lngRange,
          lte: lng + lngRange
        },
        isPublic: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            isGuest: true
          }
        },
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
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
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    // Calculate actual distances and sort
    const thoughtsWithDistance = thoughts.map(thought => {
      const distance = calculateDistance(lat, lng, thought.latitude, thought.longitude)
      return {
        ...thought,
        distance: Math.round(distance * 1000) // Convert to meters
      }
    }).sort((a, b) => a.distance - b.distance)

    return NextResponse.json(thoughtsWithDistance)
  } catch (error) {
    console.error('Error fetching thoughts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thoughts' },
      { status: 500 }
    )
  }
}

// POST /api/thoughts - Create a new thought
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Accept flexible payloads from the client
    // Prefer explicit authorId; otherwise create (or reuse) a guest by username
    let authorId: string | null = body.authorId ?? null
    const authorUsername: string | null = body.author?.username ?? body.authorUsername ?? null

    if (!authorId) {
      const username = (authorUsername && String(authorUsername).trim()) || 'Anonim'
      // Try to find an existing guest with this username, otherwise create one
      const existing = await prisma.user.findFirst({ where: { username, isGuest: true } })
      const author = existing ?? await prisma.user.create({ data: { username, isGuest: true } })
      authorId = author.id
    }

    const latitude: number = typeof body.latitude === 'number' ? body.latitude : 0
    const longitude: number = typeof body.longitude === 'number' ? body.longitude : 0

    const thought = await prisma.thought.create({
      data: {
        content,
        latitude,
        longitude,
        authorId: authorId!,
        isPublic: true
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            isGuest: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    // Shape response to include a distance field (0m if coords not provided)
    const shaped = {
      ...thought,
      distance: (latitude !== 0 && longitude !== 0) ? Math.round(calculateDistance(latitude, longitude, latitude, longitude) * 1000) : 0,
      comments: []
    }
    return NextResponse.json(shaped, { status: 201 })
  } catch (error) {
    console.error('Error creating thought:', error)
    return NextResponse.json(
      { error: 'Failed to create thought' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
