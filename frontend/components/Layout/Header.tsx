'use client'

import { Search, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default function Header() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b px-8 py-4 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar projetos, anexos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 ml-8">
        <NotificationCenter />
        <button
          type="button"
          onClick={toggleTheme}
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="text-sm text-gray-600 border-l pl-6 dark:text-gray-300">
          <p>v1.0.0</p>
        </div>
      </div>
    </header>
  )
}
