'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AnalysisPanel from '@/components/AIAnalysis/AnalysisPanel'  // ✅ CORRIGIDO
import ChatInterface from '@/components/AIAnalysis/ChatInterface'  // ✅ CORRIGIDO
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Download,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'
import { ReportPanel } from '@/components/Project/ReportPanel'

interface Project {
  id: string
  title: string
  description: string
  status: string
  combined_score: number
  institution_name?: string
  institution_cnpj?: string
  created_at: string
  updated_at: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'analysis' | 'chat'>(
    'overview'
  )
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const accessToken = session?.accessToken

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!accessToken || !projectId) {
      setProject(null)
      setLoading(false)
      return
    }

    const fetchProject = async () => {
      setLoading(true)
      try {
        const apiClient = initializeApiClient(accessToken)
        const response = await apiClient.get(`/api/projects/${projectId}`)
        setProject(response.data)
      } catch (error) {
        console.error('Erro ao buscar projeto:', error)
        toast.error('Erro ao carregar projeto')
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [accessToken, projectId, status])

  const handleDelete = async () => {
    if (!accessToken) {
      toast.error('Token de acesso não encontrado')
      return
    }

    try {
      const apiClient = initializeApiClient(accessToken)
      await apiClient.delete(`/api/projects/${projectId}`)
      toast.success('Projeto deletado com sucesso')
      router.push('/dashboard/projects')
    } catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao deletar projeto')
    }
  }

  const handleExport = async (format: 'json') => {
    try {
      if (format === 'json' && project) {
        const blob = new Blob([JSON.stringify(project, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${project.title || 'projeto'}.json`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        toast.success('Projeto exportado em JSON.')
        return
      }

      toast.info('Formato não suportado.')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar projeto')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Projeto não encontrado</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_analysis: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    submitted: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[project.status] || ''}`}>
                  {project.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Score: {project.combined_score}%</span>
              </div>

              {project.institution_name && (
                <div className="text-sm text-gray-600">
                  🏢 {project.institution_name}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/dashboard/projects/${projectId}/approval`}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Workflow
            </Link>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar JSON
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="border-b flex">
          {[
            { id: 'overview', label: 'Visão Geral', icon: FileText },
            { id: 'editor', label: 'Editor', icon: FileText },
            { id: 'analysis', label: 'Análise', icon: TrendingUp },
            { id: 'chat', label: 'Chat com IA', icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
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

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Informações</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Criado em:</span>{' '}
                      <span className="font-medium">
                        {new Date(project.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Atualizado em:</span>{' '}
                      <span className="font-medium">
                        {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                    {project.institution_cnpj && (
                      <p>
                        <span className="text-gray-600">CNPJ:</span>{' '}
                        <span className="font-medium">{project.institution_cnpj}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Conformidade</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {project.combined_score}%
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${project.combined_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  href={`/dashboard/projects/${projectId}/editor`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Editar Projeto
                </Link>
                <Link
                  href={`/dashboard/projects/${projectId}/attachments`}
                  className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
                >
                  Gerenciar Anexos
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="text-center py-12">
              <Link
                href={`/dashboard/projects/${projectId}/editor`}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Abrir Editor
              </Link>
            </div>
          )}

          {activeTab === 'analysis' && <AnalysisPanel projectId={projectId} />}

          {activeTab === 'chat' && <ChatInterface projectId={projectId} />}
        </div>
      </div>

      <div className="mt-10">
        <ReportPanel projectId={project.id} />
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Deletar Projeto?
            </h2>
            <p className="text-gray-600 mb-6">
              Esta ação não pode ser desfeita. Todos os dados associados ao projeto serão perdidos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
