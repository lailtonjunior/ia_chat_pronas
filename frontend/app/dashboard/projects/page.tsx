'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PlusCircle, Search, Filter } from 'lucide-react'
import { initializeApiClient } from '@/lib/api'

interface Project {
  id: string
  title: string
  status: string
  combined_score: number
  created_at: string
  institution_name?: string
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const accessToken = session?.accessToken

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!accessToken) {
      setProjects([])
      setLoading(false)
      return
    }

    const fetchProjects = async () => {
      setLoading(true)
      try {
        const apiClient = initializeApiClient(accessToken)
        const response = await apiClient.get('/api/projects/', {
          params: { page: 1, per_page: 100 },
        })
        setProjects(response.data.projects)
      } catch (error) {
        console.error('Erro ao buscar projetos:', error)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [accessToken, status])

  useEffect(() => {
    filterProjects()
  }, [projects, search, filterStatus])

  const filterProjects = () => {
    let filtered = projects

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.institution_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus)
    }

    setFilteredProjects(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Projetos</h1>
        <p className="text-gray-600">Gerencie todos os seus projetos PRONAS/PCD</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou instituição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-gray-400 my-auto" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="in_analysis">Em Análise</option>
              <option value="reviewed">Revisado</option>
              <option value="approved">Aprovado</option>
            </select>
          </div>

          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-5 h-5" />
            Novo Projeto
          </Link>
        </div>
      </div>

      {/* Projetos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Projeto
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Instituição
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Score
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {project.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {project.institution_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    project.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {project.combined_score}%
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/projects/${project.id}/editor`}
                    className="text-blue-600 hover:text-blue-900 font-semibold"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {projects.length === 0
                ? 'Nenhum projeto criado ainda'
                : 'Nenhum projeto corresponde aos filtros'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
