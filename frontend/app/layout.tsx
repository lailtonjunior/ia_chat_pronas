import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import SessionProvider from '@/components/providers/SessionProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema PRONAS/PCD com IA',
  description: 'Sistema inteligente para criação e análise de projetos PRONAS/PCD',
  generator: 'Next.js 15',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
