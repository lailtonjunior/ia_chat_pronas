'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'
import AnalysisPanel from '@/components/AIAnalysis/AnalysisPanel'
import ScoreCard from '@/components/AIAnalysis/ScoreCard'
import LoadingState from '@/components/Common/LoadingState'
import { initializeApiClient } from '@/lib/api'

export default function AnalysisPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [accessToken, projectId, status])

  const handleRefresh = async () => {
    if (!accessToken) {
      return
    }

    setRefreshing(true)
    try {
      const apiClient = initializeApiClient(accessToken)
      await apiClient.post(
        '/api/ai/analyze-full',
        {
          project_id: projectId,
          provider: 'combined',
          analysis_type: 'full_project',
        }
      )
      // Recarrega dados após análise
      const response = await apiClient.get(`/api/projects/${projectId}`)
      setProject(response.data)
    } catch (error) {
      console.error('Erro ao atualizar análise:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleExport = (format: 'pdf' | 'json') => {
    // Implementar download
    console.log('Exportando como', format)
  }

  if (loading) {
    return <LoadingState message="Carregando análise..." fullHeight />
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Projeto
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Análise Completa
            </h1>
            <p className="text-gray-600">
              Revisão detalhada do seu projeto PRONAS/PCD
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {refreshing ? 'Analisando...' : 'Atualizar'}
            </button>

            <div className="relative group">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white rounded-lg shadow z-10">
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 last:rounded-b-lg"
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreCard
          score={project.combined_score}
          title="Conformidade Geral"
          description="Score combinado de ambas as IAs"
          showTrend={true}
          trendDirection="up"
          trendPercent={5}
        />

        <ScoreCard
          score={project.openai_analysis?.score || 0}
          title="OpenAI Analysis"
          description="Modelo fine-tuned PRONAS/PCD"
        />

        <ScoreCard
          score={project.gemini_analysis?.score || 0}
          title="Gemini Analysis"
          description="Análise Gemini 2.5 Flash"
        />
      </div>

      {/* Detailed Analysis */}
      <AnalysisPanel projectId={projectId} />
    </div>
  )
}
