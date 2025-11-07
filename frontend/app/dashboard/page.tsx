'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PlusCircle, FileText, TrendingUp, Clock } from 'lucide-react'
import { initializeApiClient } from '@/lib/api'

interface Project {
  id: string
  title: string
  status: string
  combined_score: number
  updated_at: string
  institution_name?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
  })

  const accessToken = session?.accessToken

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!accessToken) {
      setProjects([])
      setStats({ total: 0, inProgress: 0, completed: 0 })
      setLoading(false)
      return
    }

    const fetchProjects = async () => {
      setLoading(true)
      try {
        const apiClient = initializeApiClient(accessToken)
        const response = await apiClient.get('/api/projects/', {
          params: { page: 1, per_page: 6 },
        })

        setProjects(response.data.projects)
        setStats({
          total: response.data.total,
          inProgress: response.data.projects.filter(
            (p: Project) => p.status === 'in_analysis' || p.status === 'draft'
          ).length,
          completed: response.data.projects.filter(
            (p: Project) => p.status === 'approved'
          ).length,
        })
      } catch (error) {
        console.error('Erro ao buscar projetos:', error)
        setProjects([])
        setStats({ total: 0, inProgress: 0, completed: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [accessToken, status])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {session?.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">Bem-vindo ao seu dashboard PRONAS/PCD</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Projetos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total}
              </p>
            </div>
            <FileText className="w-12 h-12 text-blue-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Em Progresso</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.inProgress}
              </p>
            </div>
            <Clock className="w-12 h-12 text-yellow-100" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Aprovados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.completed}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-100" />
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Seus Projetos</h2>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Novo Projeto
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}/editor`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">
                    {project.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    project.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status}
                  </span>
                </div>

                {project.institution_name && (
                  <p className="text-sm text-gray-600 mb-4">
                    {project.institution_name}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${project.combined_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {project.combined_score}%
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Atualizado há {formatDate(project.updated_at)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum projeto criado ainda</p>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Criar Primeiro Projeto
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'poucos segundos'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('pt-BR')
}
