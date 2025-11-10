'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, initializeApiClient } from '@/lib/api'
import type { NotificationItem } from '@/types/notification'

interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  error: string | null
}

interface UseNotificationResult extends NotificationState {
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

type SocketPayload =
  | {
      type: 'init'
      notifications: NotificationItem[]
      unread_count: number
    }
  | {
      type: 'notification'
      notification: NotificationItem
      unread_count?: number
    }
  | {
      type: 'notification_read'
      notification_id: string
      unread_count?: number
    }
  | {
      type: 'notifications_read_all'
      unread_count?: number
    }

export function useNotifications(): UseNotificationResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('pronas_access_token') ?? undefined
        initializeApiClient(token)
      }
      setLoading(true)
      const { data } = await api.notifications.list('all', 1, 20)
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar notificações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh().catch(console.error)
  }, [refresh])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const scheduleReconnect = () => {
      if (stopped) return
      reconnectTimer && clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(connect, 5000)
    }

    function connect() {
      try {
        const token = sessionStorage.getItem('pronas_access_token')
        if (!token) {
          scheduleReconnect()
          return
        }

        const base =
          process.env.NEXT_PUBLIC_WS_URL ??
          `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
        const url = `${base}/ws/notifications?token=${encodeURIComponent(token)}`
        ws = new WebSocket(url)

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as SocketPayload
            handleSocketPayload(payload)
          } catch (err) {
            console.error('Erro ao processar mensagem de notificações:', err)
          }
        }

        ws.onclose = () => {
          if (!stopped) {
            scheduleReconnect()
          }
        }

        ws.onerror = () => {
          ws?.close()
        }
      } catch (err) {
        console.error('Erro ao conectar ao WebSocket de notificações:', err)
        scheduleReconnect()
      }
    }

    const handleSocketPayload = (payload: SocketPayload) => {
      switch (payload.type) {
        case 'init':
          setNotifications(payload.notifications ?? [])
          setUnreadCount(payload.unread_count ?? 0)
          setLoading(false)
          break
        case 'notification':
          setNotifications((current) => [payload.notification, ...current].slice(0, 20))
          if (typeof payload.unread_count === 'number') {
            setUnreadCount(payload.unread_count)
          } else {
            setUnreadCount((count) => count + 1)
          }
          break
        case 'notification_read':
          setNotifications((current) =>
            current.map((notification) =>
              notification.id === payload.notification_id
                ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                : notification
            )
          )
          if (typeof payload.unread_count === 'number') {
            setUnreadCount(payload.unread_count)
          }
          break
        case 'notifications_read_all':
          setNotifications((current) =>
            current.map((notification) => ({ ...notification, is_read: true, read_at: notification.read_at ?? new Date().toISOString() }))
          )
          setUnreadCount(payload.unread_count ?? 0)
          break
        default:
          break
      }
    }

    connect()

    return () => {
      stopped = true
      reconnectTimer && clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.notifications.markRead(id)
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount((count) => Math.max(count - 1, 0))
    } catch (err) {
      console.error(err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAll()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at ?? new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }, [])

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, loading, error, refresh, markAsRead, markAllAsRead]
  )
}
