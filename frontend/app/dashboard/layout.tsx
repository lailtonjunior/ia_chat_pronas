'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ReactJoyride, { CallBackProps } from 'react-joyride'
import Sidebar from '@/components/Layout/Sidebar'
import Header from '@/components/Layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem('pronas_onboarding_done')
    if (!completed) {
      setRunTour(true)
    }
  }, [])

  const handleTourCallback = (data: CallBackProps) => {
    if (['finished', 'skipped'].includes(data.status)) {
      setRunTour(false)
      localStorage.setItem('pronas_onboarding_done', 'true')
    }
  }

  const tourSteps = [
    {
      target: 'body',
      placement: 'center',
      title: 'Bem-vindo!',
      content: 'Conheça rapidamente os principais recursos do painel.',
      disableBeacon: true,
    },
    {
      target: '.sidebar-tour',
      title: 'Menu principal',
      content: 'Acesse dashboards, projetos e chat IA por aqui.',
    },
    {
      target: '.notification-tour',
      title: 'Notificações',
      content: 'Atualizações em tempo real chegam aqui.',
    },
  ]

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ReactJoyride
        steps={tourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleTourCallback}
      />
      {/* Sidebar */}
      <div className="sidebar-tour flex">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="notification-tour">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
