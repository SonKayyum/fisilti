import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Guest login provider
    {
      id: 'guest',
      name: 'Guest',
      type: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.username) return null
        
        // Create or find guest user
        const user = await prisma.user.upsert({
          where: { username: credentials.username },
          update: {},
          create: {
            username: credentials.username,
            isGuest: true,
            name: credentials.username
          }
        })
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        }
      }
    }
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string }).id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}
