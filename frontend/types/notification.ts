export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

export type NotificationType =
  | 'ai_analysis_completed'
  | 'project_status_updated'
  | 'document_imported'
  | 'workflow_event'
  | 'system_alert'

export interface NotificationItem {
  id: string
  user_id: string
  type: NotificationType
  severity: NotificationSeverity
  channel: 'in_app' | 'email'
  title: string
  message: string
  action_url?: string | null
  data?: Record<string, unknown> | null
  is_read: boolean
  created_at: string
  read_at?: string | null
}

export interface NotificationList {
  notifications: NotificationItem[]
  total: number
  unread_count: number
  page: number
  per_page: number
}

export interface NotificationPreferences {
  ai_analysis: boolean
  project_status: boolean
  document_events: boolean
  workflow_updates: boolean
  email_digest: boolean
}
