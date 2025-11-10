import axios, { AxiosInstance } from 'axios'
import type { NotificationListResponse, NotificationPreferences } from '@/types/notification'

let apiClient: AxiosInstance

export function initializeApiClient(token?: string) {
  let baseURL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL

  if (!baseURL && typeof window !== 'undefined') {
    baseURL = window.location.origin
  }

  if (!baseURL) {
    throw new Error('API base URL não configurada. Defina API_URL ou NEXT_PUBLIC_API_URL.')
  }

  apiClient = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  let authToken = token

  if (!authToken && typeof window !== 'undefined') {
    authToken = sessionStorage.getItem('pronas_access_token') ?? undefined
  }

  if (authToken) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (typeof window !== 'undefined' && error.response?.status === 401) {
        sessionStorage.removeItem('pronas_access_token')
      }
      return Promise.reject(error)
    }
  )

  return apiClient
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    initializeApiClient()
  }
  return apiClient
}

export const api = {
  // Projects
  projects: {
    list: (page = 1, perPage = 10) =>
      getApiClient().get('/api/projects/', { params: { page, per_page: perPage } }),
    get: (id: string) => getApiClient().get(`/api/projects/${id}`),
    create: (data: any) => getApiClient().post('/api/projects/', data),
    update: (id: string, data: any) =>
      getApiClient().put(`/api/projects/${id}`, data),
    delete: (id: string) => getApiClient().delete(`/api/projects/${id}`),
    submitForReview: (id: string, approverIds: string[], message?: string) =>
      getApiClient().post(`/api/projects/${id}/submit_review`, {
        approver_ids: approverIds,
        message,
      }),
    approve: (id: string, comment?: string) =>
      getApiClient().post(`/api/projects/${id}/approve`, { comment }),
    reject: (id: string, comment?: string) =>
      getApiClient().post(`/api/projects/${id}/reject`, { comment }),
    getWorkflow: (id: string) => getApiClient().get(`/api/projects/${id}/workflow`),
    listComments: (id: string) => getApiClient().get(`/api/projects/${id}/comments`),
    addComment: (id: string, content: string) =>
      getApiClient().post(`/api/projects/${id}/comments`, { content }),
    requestExport: (id: string, format: 'pdf' | 'docx') =>
      getApiClient().post(`/api/projects/${id}/export`, { format }),
    listReports: (id: string) => getApiClient().get(`/api/projects/${id}/reports`),
  },

  // Documents
  documents: {
    upload: (file: File, projectId?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      if (projectId) formData.append('project_id', projectId)
      return getApiClient().post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    analyze: (documentId: string) =>
      getApiClient().post(`/api/documents/${documentId}/analyze`),
    versions: (documentId: string) =>
      getApiClient().get(`/api/documents/${documentId}/versions`),
    diff: (documentId: string, versionA: number, versionB: number) =>
      getApiClient().get(`/api/documents/${documentId}/diff`, {
        params: { version_a: versionA, version_b: versionB },
      }),
    rollback: (documentId: string, transactionId: number) =>
      getApiClient().post(`/api/documents/${documentId}/rollback`, {
        transaction_id: transactionId,
      }),
  },

  // AI Analysis
  ai: {
    analyzeFull: (projectId: string) =>
      getApiClient().post('/api/ai/analyze-full', { project_id: projectId }),
    analyzeSection: (projectId: string, section: string, content: string) =>
      getApiClient().post('/api/ai/analyze-section', {
        project_id: projectId,
        section,
        content,
      }),
    chat: (projectId: string, message: string, history: any[] = []) =>
      getApiClient().post('/api/ai/chat', {
        project_id: projectId,
        message,
        conversation_history: history,
      }),
  },

  notifications: {
    list: (status: 'all' | 'read' | 'unread' = 'all', page = 1, perPage = 20) =>
      getApiClient().get<NotificationListResponse>('/api/notifications/', {
        params: {
          status_filter: status,
          page,
          per_page: perPage,
        },
      }),
    markRead: (id: string) => getApiClient().post(`/api/notifications/${id}/read`),
    markAll: () => getApiClient().post('/api/notifications/read-all'),
    getPreferences: () => getApiClient().get<NotificationPreferences>('/api/notifications/preferences'),
    updatePreferences: (data: Partial<NotificationPreferences>) =>
      getApiClient().put<NotificationPreferences>('/api/notifications/preferences', data),
  },
}
