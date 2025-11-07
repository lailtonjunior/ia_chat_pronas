'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Meus Projetos', href: '/dashboard/projects' },
  { icon: MessageSquare, label: 'Chat com IA', href: '/dashboard/ai-chat' },
  { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🚀</span>
            </div>
            <span>PRONAS</span>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="mt-8 space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
          {session?.user && (
            <>
              <div className="flex items-center gap-3 mb-4">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Usuário'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold">
                    {(session.user.name || session.user.email || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-400">{session.user.email}</p>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sair</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed md:hidden inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
