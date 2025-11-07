import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id?: string
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    id?: string
    backendUserId?: string
    backendUserName?: string
    backendUserEmail?: string
    backendUserImage?: string
    googleAccessToken?: string
    googleIdToken?: string
  }
}
