'use client'

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import React, { useEffect } from 'react'

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const basePath = process.env.NEXT_PUBLIC_NEXTAUTH_BASE_PATH ?? '/auth'

  return (
    <NextAuthSessionProvider basePath={basePath}>
      <TokenSync />
      {children}
    </NextAuthSessionProvider>
  )
}

function TokenSync() {
  const { data } = useSession()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (data?.accessToken) {
      sessionStorage.setItem('pronas_access_token', data.accessToken)
    } else {
      sessionStorage.removeItem('pronas_access_token')
    }
  }, [data?.accessToken])

  return null
}
