'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ApprovalWorkflow } from '@/components/Project/ApprovalWorkflow'
import type { ProjectSummary } from '@/types/project'
import { api, initializeApiClient } from '@/lib/api'

export default function ProjectApprovalPage() {
  const params = useParams()
  const projectId = params.id as string
  const { data: session, status } = useSession()
  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProject = async () => {
    try {
      const response = await api.projects.get(projectId)
      setProject(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível carregar o projeto.')
      setProject(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    initializeApiClient(session?.accessToken)
    fetchProject().catch(console.error)
  }, [session?.accessToken, status, projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Carregando workflow...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Projeto não encontrado.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aprovação e Comentários</h1>
        <p className="text-sm text-gray-500">
          Gerencie o workflow, acompanhe comentários e avance o status do projeto.
        </p>
      </div>
      <ApprovalWorkflow
        project={project}
        onRefreshProject={fetchProject}
        currentUserId={session?.user?.id}
      />
    </div>
  )
}
