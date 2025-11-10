export type NotificationChannel = 'in_app' | 'email'
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'
export type NotificationStatus = 'pending' | 'sent' | 'failed'
export type NotificationType =
  | 'ai_analysis_completed'
  | 'project_status_updated'
  | 'document_imported'
  | 'workflow_event'
  | 'system_alert'
  | 'report_ready'

export interface NotificationItem {
  id: string
  user_id: string
  type: NotificationType
  severity: NotificationSeverity
  channel: NotificationChannel
  title: string
  message: string
  action_url?: string | null
  data?: Record<string, unknown> | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  status?: NotificationStatus
}

export interface NotificationListResponse {
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
  email_on_submission: boolean
  email_on_approval: boolean
}
