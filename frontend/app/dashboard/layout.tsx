'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Layout/Sidebar'
import Header from '@/components/Layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem('pronas_onboarding_done')
    if (!completed) {
      setShowGuide(true)
    }
  }, [])

  const dismissGuide = () => {
    setShowGuide(false)
    localStorage.setItem('pronas_onboarding_done', 'true')
  }

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
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Bem-vindo ao painel PRONAS</h2>
            <p className="text-sm text-gray-600">
              Três passos rápidos para se orientar:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>
                Explore o menu lateral <span className="font-semibold">(área escura à esquerda)</span> para acessar projetos, IA e configurações.
              </li>
              <li>
                O sino no canto superior direito mostra notificações em tempo real (workflow, IA, exportações).
              </li>
              <li>
                Os projetos possuem abas dedicadas para editor, análises, chat e aprovação.
              </li>
            </ol>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={dismissGuide}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
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
