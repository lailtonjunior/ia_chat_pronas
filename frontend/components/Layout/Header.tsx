'use client'

import { Search } from 'lucide-react'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default function Header() {
  return (
    <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar projetos, anexos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 ml-8">
        <NotificationCenter />

        {/* Version */}
        <div className="text-sm text-gray-600 border-l pl-6">
          <p>v1.0.0</p>
        </div>
      </div>
    </header>
  )
}
