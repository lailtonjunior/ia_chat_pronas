import axios, { AxiosInstance } from 'axios'

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
}
