'use client'

import Link from 'next/link'
import { Bell, Check, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationItem } from '@/types/notification'

const severityAccent: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, loading, error, refresh, markAsRead, markAllAsRead } =
    useNotifications()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const hasNotifications = notifications.length > 0

  const handleMarkAsRead = async (id: string, actionUrl?: string | null) => {
    await markAsRead(id)
    if (actionUrl) {
      setIsOpen(false)
    }
  }

  const formattedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        relativeTime: formatDistanceToNow(new Date(notification.created_at), {
          addSuffix: true,
          locale: ptBR,
        }),
      })),
    [notifications]
  )

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] px-1 h-5 text-xs bg-red-600 text-white rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <p className="font-semibold text-gray-900">Notificações</p>
              <p className="text-xs text-gray-500">
                {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void markAllAsRead()}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                disabled={unreadCount === 0}
              >
                Marcar todas
              </button>
              <button
                onClick={() => void refresh()}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {loading && !hasNotifications ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : hasNotifications ? (
              formattedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 transition ${
                    notification.is_read ? 'opacity-80' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        severityAccent[notification.severity] ?? severityAccent.info
                      }`}
                    >
                      {notification.title.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        <span className="text-xs text-gray-500">{notification.relativeTime}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                      <div className="flex items-center gap-3 mt-3">
                        {!notification.is_read && (
                          <button
                            onClick={() => void handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marcar como lida
                          </button>
                        )}

                        {notification.action_url && (
                          <Link
                            href={notification.action_url}
                            className="text-xs text-gray-600 hover:text-gray-900"
                            onClick={() =>
                              void handleMarkAsRead(notification.id, notification.action_url)
                            }
                          >
                            Abrir
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                Nenhuma notificação no momento.
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-red-600 border-t border-red-100 bg-red-50">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
