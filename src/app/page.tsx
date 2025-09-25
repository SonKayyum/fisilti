'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, MessageCircle, Plus, User, ZoomIn, ZoomOut, RotateCcw, Home as HomeIcon } from 'lucide-react'

interface Thought {
  id: string
  content: string
  distance: number
  author: {
    username: string
    isGuest: boolean
  }
  createdAt: string
  comments: unknown[]
}

interface Position {
  x: number
  y: number
  z: number
}

export default function Home() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null)
  const [focusedThought, setFocusedThought] = useState<Thought | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [newThoughtContent, setNewThoughtContent] = useState('')
  const [tempUsername, setTempUsername] = useState('')
  const [currentUser, setCurrentUser] = useState<{username: string, isGuest: boolean} | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedThoughtForComment, setSelectedThoughtForComment] = useState<Thought | null>(null)
  const [newCommentContent, setNewCommentContent] = useState('')
  const [loginUsername, setLoginUsername] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [thoughtPositions, setThoughtPositions] = useState<Map<string, Position>>(new Map())

  useEffect(() => {
    // Sample thoughts data
    const sampleThoughts: Thought[] = [
      {
        id: '1',
        content: 'Bugün hava çok güzel, parkta yürüyüş yapmak için mükemmel bir gün! Doğanın sesini dinlemek bana huzur veriyor.',
        distance: 500,
        author: { username: 'Anonim', isGuest: true },
        createdAt: '2 saat önce',
        comments: []
      },
      {
        id: '2',
        content: 'Yeni bir kafede çalışıyorum ve buradaki atmosfer gerçekten ilham verici. Yaratıcılığımı besleyen bir ortam.',
        distance: 1200,
        author: { username: 'Anonim', isGuest: true },
        createdAt: '4 saat önce',
        comments: []
      },
      {
        id: '3',
        content: 'Şehirde yaşamak bazen yorucu olabiliyor ama bu anonimlik hissi gerçekten rahatlatıcı.',
        distance: 2100,
        author: { username: 'Anonim', isGuest: true },
        createdAt: '6 saat önce',
        comments: []
      },
      {
        id: '4',
        content: 'Bu akşam güneşin batışını izliyorum. Hayatın küçük anları bazen en büyük mutlulukları getiriyor.',
        distance: 800,
        author: { username: 'Anonim', isGuest: true },
        createdAt: '1 saat önce',
        comments: []
      },
      {
        id: '5',
        content: 'Yeni bir kitap okumaya başladım. Sayfalar arasında kaybolmak harika bir his.',
        distance: 1500,
        author: { username: 'Anonim', isGuest: true },
        createdAt: '3 saat önce',
        comments: []
      },
      {
        id: '6',
        content: 'Müzik dinlerken zamanın nasıl geçtiğini anlamıyorum. Sanat gerçekten ruhu besliyor.',
        distance: 3000,
        author: { username: 'Anonim', isGuest: true },
        createdAt: '8 saat önce',
        comments: []
      }
    ]

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setIsLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsLoading(false)
        }
      )
    } else {
      setIsLoading(false)
    }

    // Set sample thoughts
    setThoughts(sampleThoughts)
  }, [])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  const resetView = () => {
    setZoom(1)
    setViewOffset({ x: 0, y: 0 })
  }

  // Collision detection function
  const checkCollision = (newPos: Position, existingPositions: Position[], minDistance: number = 120) => {
    // Check collision with other thoughts only
    return existingPositions.some(pos => {
      const distance = Math.sqrt(
        Math.pow(newPos.x - pos.x, 2) + Math.pow(newPos.y - pos.y, 2)
      )
      return distance < minDistance
    })
  }

  // Generate non-overlapping positions
  const generateThoughtPositions = useCallback(() => {
    const positions = new Map<string, Position>()
    const usedPositions: Position[] = []
    
    // Sort thoughts by distance to ensure closer ones get better positions
    const sortedThoughts = [...thoughts].sort((a, b) => a.distance - b.distance)
    
    sortedThoughts.forEach((thought, index) => {
      let attempts = 0
      let position: Position = { x: 50, y: 50, z: 0 }
      let foundPosition = false
      
      // Create concentric circles based on distance - more logical mapping
      let baseRadius: number
      let maxRadius: number
      
      if (thought.distance <= 100) {
        // Very close: 5-15% from center
        baseRadius = 5
        maxRadius = 15
      } else if (thought.distance <= 500) {
        // Close: 15-25% from center
        baseRadius = 15
        maxRadius = 25
      } else if (thought.distance <= 1000) {
        // Medium: 25-35% from center
        baseRadius = 25
        maxRadius = 35
      } else if (thought.distance <= 2000) {
        // Far: 35-45% from center
        baseRadius = 35
        maxRadius = 45
      } else {
        // Very far: 45-55% from center
        baseRadius = 45
        maxRadius = 55
      }
      
      while (!foundPosition && attempts < 150) {
        // Strategy 1: Concentric circles with better spacing
        if (attempts < 50) {
          const angle = (index * 2.4 + Math.random() * 0.8) * Math.PI // Better angle distribution
          const radius = baseRadius + Math.random() * (maxRadius - baseRadius)
          position = {
            x: Math.cos(angle) * radius + 50 - viewOffset.x,
            y: Math.sin(angle) * radius + 50 - viewOffset.y,
            z: Math.random() * 30
          }
        }
        // Strategy 2: Grid-based with larger spacing
        else if (attempts < 100) {
          const gridCols = Math.ceil(Math.sqrt(sortedThoughts.length * 1.5))
          const gridIndex = index + Math.floor(attempts / 10)
          const gridX = (gridIndex % gridCols) * (70 / gridCols) + 15
          const gridY = Math.floor(gridIndex / gridCols) * (70 / gridCols) + 15
          position = {
            x: gridX - viewOffset.x,
            y: gridY - viewOffset.y,
            z: Math.random() * 20
          }
        }
        // Strategy 3: Random with better bounds
        else {
          position = {
            x: 15 + Math.random() * 70 - viewOffset.x,
            y: 15 + Math.random() * 70 - viewOffset.y,
            z: Math.random() * 25
          }
        }
        
        // Ensure position is within bounds
        position.x = Math.max(10, Math.min(90, position.x))
        position.y = Math.max(10, Math.min(90, position.y))
        
        if (!checkCollision(position, usedPositions)) {
          foundPosition = true
        }
        
        attempts++
      }
      
      // If still no position found, force a position with minimal collision
      if (!foundPosition) {
        position = {
          x: 20 + (index * 15) % 60 - viewOffset.x,
          y: 20 + Math.floor((index * 15) / 60) * 15 - viewOffset.y,
          z: Math.random() * 20
        }
        position.x = Math.max(10, Math.min(90, position.x))
        position.y = Math.max(10, Math.min(90, position.y))
      }
      
      positions.set(thought.id, position)
      usedPositions.push(position)
    })
    
    setThoughtPositions(positions)
  }, [thoughts, viewOffset])

  const getThoughtPosition = (thought: Thought) => {
    return thoughtPositions.get(thought.id) || { x: 50, y: 50, z: 0 }
  }

  const getThoughtSize = (distance: number) => {
    const baseSize = 12
    const maxDistance = 5000
    const sizeMultiplier = Math.max(0.6, 1 - (distance / maxDistance))
    return Math.max(8, baseSize * sizeMultiplier * zoom)
  }

  const getThoughtOpacity = (distance: number) => {
    const maxDistance = 5000
    const baseOpacity = Math.max(0.4, 1 - (distance / maxDistance))
    // Make opacity more responsive to zoom
    return Math.min(1, baseOpacity + (zoom - 1) * 0.3)
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }
    
    setViewOffset(newOffset)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Update positions when zoom or offset changes
  useEffect(() => {
    generateThoughtPositions()
  }, [generateThoughtPositions])

  // Handle creating new thought
  const handleCreateThought = () => {
    if (!newThoughtContent.trim()) return
    
    // If no user, use temp username
    const user = currentUser || { username: tempUsername.trim() || 'Anonim', isGuest: true }
    
    // Calculate distance based on user's actual location
    let distance = 0
    if (userLocation) {
      // For demo purposes, simulate nearby location (within 100m)
      distance = Math.random() * 100 + 10 // 10-110m from user
    } else {
      // If no location, use random distance
      distance = Math.random() * 2000 + 100
    }
    
    const newThought: Thought = {
      id: Date.now().toString(),
      content: newThoughtContent,
      distance: Math.round(distance),
      author: user,
      createdAt: 'Şimdi',
      comments: []
    }
    
    // Set current user if not already set
    if (!currentUser) {
      setCurrentUser(user)
    }
    
    setThoughts(prev => [newThought, ...prev])
    setNewThoughtContent('')
    setTempUsername('')
    setShowCreateModal(false)
  }

  // Handle guest login
  const handleGuestLogin = (username: string) => {
    setCurrentUser({ username, isGuest: true })
    setShowLoginModal(false)
    setLoginUsername('')
  }

  // Handle adding comment
  const handleAddComment = () => {
    if (!newCommentContent.trim() || !selectedThoughtForComment) return

    const user = currentUser || { username: 'Anonim', isGuest: true }
    
    const newComment = {
      id: Date.now().toString(),
      content: newCommentContent,
      author: user,
      createdAt: 'Şimdi'
    }

    // Update the thought with new comment
    setThoughts(prev => prev.map(thought => 
      thought.id === selectedThoughtForComment.id 
        ? { ...thought, comments: [...thought.comments, newComment] }
        : thought
    ))

    // Update focused thought if it's the same
    if (focusedThought?.id === selectedThoughtForComment.id) {
      setFocusedThought(prev => prev ? {
        ...prev,
        comments: [...prev.comments, newComment]
      } : null)
    }

    setNewCommentContent('')
    setShowCommentModal(false)
    setSelectedThoughtForComment(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Konumunuz alınıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Fısıltı
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-white/80 rounded-full px-3 py-2 shadow-sm">
              <button 
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={resetView}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full hover:shadow-lg transition-all"
            >
              <User className="w-4 h-4" />
              <span>{currentUser ? currentUser.username : 'Giriş Yap'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Cloud Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[calc(100vh-80px)] overflow-hidden select-none"
        style={{ 
          perspective: '1000px',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          setSelectedThoughtId(null)
          setFocusedThought(null)
        }}
      >

        {/* Focused Thought - Displayed at top when selected */}
        {focusedThought && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/50">
              <div className="flex items-start space-x-3">
                <div 
                  className="rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: `linear-gradient(135deg, hsl(200, 70%, 60%), hsl(220, 70%, 60%))`
                  }}
                >
                  <span className="text-sm">
                    {focusedThought.author.username.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-800">
                      {focusedThought.author.username}
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-400 text-sm">
                      {focusedThought.distance}m
                    </span>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-gray-400 text-sm">
                      {focusedThought.createdAt}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {focusedThought.content}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedThoughtForComment(focusedThought)
                        setShowCommentModal(true)
                      }}
                      className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{focusedThought.comments.length} yorum</span>
                    </button>
                    <button 
                      onClick={() => {
                        setFocusedThought(null)
                        setSelectedThoughtId(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
                    >
                      ✕ Kapat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Thoughts - Hide only the focused one */}
        {thoughts.map((thought, index) => {
          // Skip rendering the focused thought in floating mode
          if (focusedThought?.id === thought.id) {
            return null
          }
          const position = getThoughtPosition(thought)
          const size = getThoughtSize(thought.distance)
          const opacity = getThoughtOpacity(thought.distance)
          
          return (
            <div
              key={thought.id}
              className="absolute cursor-pointer group pointer-events-auto"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `translateZ(${position.z}px)`,
                opacity: opacity,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                zIndex: selectedThoughtId === thought.id ? 9999 : Math.floor(opacity * 10) + 10
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (focusedThought?.id === thought.id) {
                  // If clicking the same thought, unfocus it
                  setFocusedThought(null)
                  setSelectedThoughtId(null)
                } else {
                  // Focus on this thought
                  setFocusedThought(thought)
                  setSelectedThoughtId(thought.id)
                }
                console.log('Thought clicked:', thought.id)
              }}
            >
              <div 
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                style={{
                  width: `${Math.max(200, size * 15)}px`,
                  fontSize: `${size}px`,
                  maxWidth: '300px'
                }}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className="rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                    style={{
                      width: `${size * 2}px`,
                      height: `${size * 2}px`,
                      background: `linear-gradient(135deg, hsl(${index * 60}, 70%, 60%), hsl(${index * 60 + 30}, 70%, 60%))`
                    }}
                  >
                    <span style={{ fontSize: `${size * 0.8}px` }}>
                      {thought.author.username.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-800" style={{ fontSize: `${size * 0.9}px` }}>
                        {thought.author.username}
                      </span>
                      <span className="text-gray-400" style={{ fontSize: `${size * 0.7}px` }}>•</span>
                      <span className="text-gray-400" style={{ fontSize: `${size * 0.7}px` }}>
                        {thought.distance}m
                      </span>
                    </div>
                    <p 
                      className="text-gray-700 leading-relaxed"
                      style={{ fontSize: `${size}px` }}
                    >
                      {thought.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-400" style={{ fontSize: `${size * 0.7}px` }}>
                        {thought.createdAt}
                      </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedThoughtForComment(thought)
                                setShowCommentModal(true)
                              }}
                              className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span style={{ fontSize: `${size * 0.7}px` }}>{thought.comments.length}</span>
                            </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Action Buttons */}
        <div className="absolute bottom-8 right-8 z-20 flex flex-col space-y-3">
          {/* Home Button - Return to your location */}
          <button 
                  onClick={() => {
                    setViewOffset({ x: 0, y: 0 })
                    setZoom(1)
                    setSelectedThoughtId(null)
                    setFocusedThought(null)
                  }}
            className="w-14 h-14 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center border border-gray-200"
            title="Kendi konumuna dön"
          >
            <HomeIcon className="w-5 h-5" />
          </button>
          
          {/* Create Thought Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
            title="Yeni fısıltı paylaş"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Location Status */}
        <div className="absolute top-4 left-4 z-20">
          {userLocation ? (
            <div className="bg-green-50/90 backdrop-blur-sm border border-green-200 rounded-lg p-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-green-800 text-sm">
                Konum aktif
              </span>
            </div>
          ) : (
            <div className="bg-yellow-50/90 backdrop-blur-sm border border-yellow-200 rounded-lg p-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-800 text-sm">
                Konum kapalı
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Create Thought Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Yeni Fısıltı Paylaş</h3>
            
            {/* Username input if not logged in */}
            {!currentUser && (
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Kullanıcı adınız (opsiyonel)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
            )}
            
            <textarea
              value={newThoughtContent}
              onChange={(e) => setNewThoughtContent(e.target.value)}
              placeholder="Düşüncelerinizi paylaşın..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewThoughtContent('')
                  setTempUsername('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreateThought}
                disabled={!newThoughtContent.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Paylaş
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Comment Modal */}
        {showCommentModal && selectedThoughtForComment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Yorum Yap</h3>
              
              {/* Original Thought */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-800 text-sm">
                    {selectedThoughtForComment.author.username}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-400 text-sm">
                    {selectedThoughtForComment.distance}m
                  </span>
                </div>
                <p className="text-gray-700 text-sm">
                  {selectedThoughtForComment.content}
                </p>
              </div>

              {/* Comments List */}
              {selectedThoughtForComment.comments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Yorumlar</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {(selectedThoughtForComment.comments as {id: string, content: string, author: {username: string}, createdAt: string}[]).map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-800 text-sm">
                            {comment.author.username}
                          </span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-gray-400 text-xs">
                            {comment.createdAt}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment Input */}
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCommentModal(false)
                    setNewCommentContent('')
                    setSelectedThoughtForComment(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newCommentContent.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Yorum Yap
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Fısıltı&apos;ya Katıl</h3>
            <p className="text-gray-600 mb-4">Anonim olarak katılın ve düşüncelerinizi paylaşın.</p>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Kullanıcı adınız"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && loginUsername.trim()) {
                  handleGuestLogin(loginUsername.trim())
                }
              }}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  setLoginUsername('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (loginUsername.trim()) {
                    handleGuestLogin(loginUsername.trim())
                  }
                }}
                disabled={!loginUsername.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Katıl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(-1deg); }
          75% { transform: translateY(-15px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  )
}
