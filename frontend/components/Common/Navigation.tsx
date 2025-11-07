'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface NavigationItem {
  label: string
  href: string
  icon?: ReactNode
}

interface NavigationProps {
  items: NavigationItem[]
  variant?: 'horizontal' | 'vertical'
}

export default function Navigation({
  items,
  variant = 'horizontal',
}: NavigationProps) {
  const pathname = usePathname()

  const containerClasses =
    variant === 'horizontal' ? 'flex gap-1' : 'flex flex-col gap-1'

  return (
    <nav className={containerClasses}>
      {items.map((item) => {
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-600 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
