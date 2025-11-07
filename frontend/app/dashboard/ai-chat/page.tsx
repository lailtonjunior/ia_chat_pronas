'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MessageSquare, Send, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'

interface Project {
  id: string
  title: string
  institution: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function AIChatPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProjects()
    }
  }, [status, session])

  const fetchProjects = async () => {
    try {
      const apiClient = initializeApiClient((session as any)?.accessToken)
      const response = await apiClient.get('/api/projects/')
      setProjects(response.data.projects ?? response.data)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedProject) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const apiClient = initializeApiClient((session as any)?.accessToken)
      const response = await apiClient.post(
        `/api/projects/${selectedProject.id}/chat`,
        {
          message: input,
          conversation_history: messages,
        }
      )

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error(error.response?.data?.detail || 'Erro ao enviar mensagem')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  if (status === 'unauthenticated') {
    return <div className="flex items-center justify-center h-screen">Não autenticado</div>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h2 className="font-bold text-lg mb-4">Projetos</h2>
          <div className="space-y-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProject(project)
                  setMessages([])
                }}
                className={`w-full text-left px-4 py-2 rounded transition-colors ${
                  selectedProject?.id === project.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm">{project.title}</div>
                <div className="text-xs text-gray-500">{project.institution}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            <div className="bg-white border-b p-6 shadow-sm">
              <h1 className="text-2xl font-bold">{selectedProject.title}</h1>
              <p className="text-gray-600 text-sm">Chat com IA sobre este projeto</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <MessageSquare className="w-12 h-12 mr-4" />
                  <div>
                    <p className="font-semibold">Comece a conversa</p>
                    <p className="text-sm">Faça perguntas sobre o projeto</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-900">Digitando...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border-t p-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua pergunta..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-semibold text-lg">Selecione um projeto para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
