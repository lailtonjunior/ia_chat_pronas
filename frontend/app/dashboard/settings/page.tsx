'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Bell, Lock } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { data: session } = useSession()

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Lock },
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
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Análises de IA</p>
                  <p className="text-sm text-gray-600">Notificar quando análise for concluída</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Sugestões</p>
                  <p className="text-sm text-gray-600">Receber sugestões de melhoria</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">Resumo semanal por email</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
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
