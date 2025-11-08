'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Bell, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/api'
import type { NotificationPreferences } from '@/types/notification'

const defaultPreferences: NotificationPreferences = {
  ai_analysis: true,
  project_status: true,
  document_events: true,
  workflow_updates: true,
  email_digest: false,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [updatingField, setUpdatingField] = useState<keyof NotificationPreferences | null>(null)
  const { data: session } = useSession()

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Lock },
  ]

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await api.notifications.getPreferences()
        setPreferences(response.data ?? defaultPreferences)
      } catch (error) {
        console.error(error)
        toast.error('Não foi possível carregar suas preferências de notificação.')
      } finally {
        setLoadingPreferences(false)
      }
    }

    void loadPreferences()
  }, [])

  const handlePreferenceToggle = async (field: keyof NotificationPreferences) => {
    setUpdatingField(field)
    const nextValue = !preferences[field]
    setPreferences((current) => ({ ...current, [field]: nextValue }))

    try {
      const response = await api.notifications.updatePreferences({
        [field]: nextValue,
      })
      setPreferences(response.data)
      toast.success('Preferência atualizada com sucesso.')
    } catch (error) {
      console.error(error)
      setPreferences((current) => ({ ...current, [field]: !nextValue }))
      toast.error('Não foi possível salvar sua preferência. Tente novamente.')
    } finally {
      setUpdatingField(null)
    }
  }

  const notificationOptions: Array<{
    id: keyof NotificationPreferences
    title: string
    description: string
  }> = [
    {
      id: 'ai_analysis',
      title: 'Análises de IA',
      description: 'Seja avisado quando uma análise combinada for concluída',
    },
    {
      id: 'project_status',
      title: 'Status do projeto',
      description: 'Receba alertas quando o status avançar ou mudar',
    },
    {
      id: 'document_events',
      title: 'Importação de documentos',
      description: 'Notificações ao terminar o processamento de PDFs',
    },
    {
      id: 'workflow_updates',
      title: 'Workflow e aprovações',
      description: 'Avisos de revisões, comentários e aprovações',
    },
    {
      id: 'email_digest',
      title: 'Resumo semanal por email',
      description: 'Relatório consolidado enviado semanalmente',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={session?.user?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <p className="text-sm text-gray-600">
                Suas informações são gerenciadas pelo Google. Para alterá-las, acesse sua conta Google.
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {loadingPreferences ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="p-4 border rounded-lg animate-pulse bg-gray-50"
                    >
                      <div className="h-3 w-1/3 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                notificationOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{option.title}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={preferences[option.id]}
                      disabled={updatingField === option.id}
                      onChange={() => handlePreferenceToggle(option.id)}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="font-semibold text-green-900">Segurança Google</p>
                <p className="text-sm text-green-700 mt-1">
                  Sua conta está protegida pela autenticação do Google
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-gray-900">Sessões Ativas</p>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sessão Atual</p>
                      <p className="text-sm text-gray-600">
                        Ativo agora • {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="text-green-600 font-semibold">Ativo</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
