import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

async function exchangeGoogleTokenForBackendJwt(params: {
  idToken?: string | null
  email?: string | null
}) {
  const backendUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL
  if (!backendUrl) {
    console.error('Backend URL não configurado para autenticação.')
    return null
  }

  if (!params.idToken || !params.email) {
    console.error('Token ou email ausente ao tentar autenticar no backend.')
    return null
  }

  try {
    const response = await fetch(`${backendUrl}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_token: params.idToken,
        email: params.email,
      }),
    })

    if (!response.ok) {
      console.error('Falha ao autenticar no backend:', response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error)
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Persistir identificadores básicos
      if (user?.id) {
        token.id = user.id
      }

      if (account && user) {
        token.googleAccessToken = account.access_token
        token.googleIdToken = account.id_token

        const backendAuth = await exchangeGoogleTokenForBackendJwt({
          idToken: account.id_token,
          email: user.email,
        })

        if (backendAuth?.access_token) {
          token.accessToken = backendAuth.access_token
          token.backendUserId = backendAuth.user?.id ?? token.id
          token.backendUserName = backendAuth.user?.name ?? user.name ?? undefined
          token.backendUserEmail = backendAuth.user?.email ?? user.email ?? undefined
          token.backendUserImage = backendAuth.user?.picture_url ?? user.image ?? undefined
        } else {
          token.accessToken = undefined
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.backendUserId as string) ?? (token.id as string | undefined)
        session.user.name = (token.backendUserName as string | undefined) ?? session.user.name
        session.user.email = (token.backendUserEmail as string | undefined) ?? session.user.email
        session.user.image = (token.backendUserImage as string | undefined) ?? session.user.image
      }

      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
}
