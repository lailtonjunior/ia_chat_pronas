'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { NotificationItem } from '@/types/notification'

interface UseNotificationsResult {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

type NotificationSocketPayload =
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

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await api.notifications.list('all', 1, 20)
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unread_count)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar notificações', err)
      setError('Não foi possível carregar notificações agora.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const getWsBase = () => {
      if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, '')
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}`
    }

    const scheduleReconnect = (delay = 5000) => {
      if (stopped) return
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(connect, delay)
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as NotificationSocketPayload
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
              current.map((notification) => ({
                ...notification,
                is_read: true,
                read_at: notification.read_at ?? new Date().toISOString(),
              }))
            )
            setUnreadCount(payload.unread_count ?? 0)
            break
          default:
            break
        }
      } catch (err) {
        console.error('Mensagem WS inválida', err)
      }
    }

    function connect() {
      if (stopped) return
      const token = sessionStorage.getItem('pronas_access_token')
      if (!token) {
        scheduleReconnect(2000)
        return
      }
      const base = getWsBase()
      const url = `${base}/ws/notifications?token=${token}`

      try {
        ws = new WebSocket(url)
      } catch (err) {
        console.error('Erro ao iniciar WebSocket de notificações', err)
        scheduleReconnect()
        return
      }

      ws.onmessage = handleMessage
      ws.onclose = () => {
        if (!stopped) {
          scheduleReconnect()
        }
      }
      ws.onerror = () => {
        ws?.close()
      }
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      ws?.close()
    }
  }, [])

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await api.notifications.markRead(id)
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : notification
          )
        )
        setUnreadCount((count) => Math.max(count - 1, 0))
      } catch (err) {
        console.error('Erro ao marcar notificação como lida', err)
      }
    },
    []
  )

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAll()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Erro ao marcar todas notificações', err)
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
