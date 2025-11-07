'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'

interface Suggestion {
  section?: string
  reason?: string
  original_text?: string
  suggested_text?: string
  priority?: string
}

interface CriticalIssue {
  section?: string
  issue?: string
  severity?: string
  solution?: string
}

interface BackendAnalysis {
  id: string
  score: number
  provider?: string
  analysis_type?: string
  result: Record<string, any>
  suggestions?: Suggestion[]
  critical_issues?: CriticalIssue[]
  warnings?: any[]
  tokens_used?: number
  processing_time?: number
  created_at?: string
}

type Prediction = 'approvable' | 'attention' | 'needs_improvement'

interface ParsedAnalysis {
  score: number
  summary: string
  detailedAnalysis?: string
  strengths: string[]
  weaknesses: string[]
  prediction: Prediction
  suggestions: Suggestion[]
  criticalIssues: CriticalIssue[]
  compliance?: Record<string, any>
  tokensUsed?: number
  processingTime?: number
  createdAt?: string
  raw: BackendAnalysis
}

interface AnalysisPanelProps {
  projectId: string
}

export default function AnalysisPanel({ projectId }: AnalysisPanelProps) {
  const { data: session } = useSession()
  const [analysis, setAnalysis] = useState<ParsedAnalysis | null>(null)
  const [history, setHistory] = useState<BackendAnalysis[]>([])
  const [activeTab, setActiveTab] =
    useState<'overview' | 'suggestions' | 'issues'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (!session?.accessToken) {
      setIsLoading(false)
      return
    }
    fetchAnalysisResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, projectId])

  const fetchAnalysisResults = async () => {
    try {
      setIsLoading(true)
      const apiClient = initializeApiClient(session?.accessToken)
      const { data } = await apiClient.get(`/api/ai/project/${projectId}/analyses`)
      setHistory(data || [])
      if (data?.length) {
        setAnalysis(parseAnalysisJSON(data[0]))
      } else {
        setAnalysis(null)
      }
    } catch (error) {
      console.error('Erro ao buscar análises:', error)
      toast.error('Não foi possível carregar a análise mais recente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeProject = async () => {
    if (!session?.accessToken) {
      toast.error('Faça login para usar a análise de IA.')
      return
    }

    const toastId = 'analysis-progress'
    setIsAnalyzing(true)
    toast.loading('Executando análise com IA...', { id: toastId })

    try {
      const apiClient = initializeApiClient(session.accessToken)
      const { data } = await apiClient.post('/api/ai/analyze-full', {
        project_id: projectId,
        provider: 'combined',
        analysis_type: 'full_project',
      })

      const parsed = parseAnalysisJSON(data)
      setAnalysis(parsed)
      setHistory((prev) => [data, ...prev])
      toast.success('Análise concluída com sucesso!', { id: toastId })
    } catch (error: any) {
      console.error('Erro ao executar análise:', error)
      const detail = error?.response?.data?.detail ?? 'Falha ao analisar projeto.'
      toast.error(detail, { id: toastId })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const renderScoreGauge = () => {
    if (!analysis) return null
    const angle = Math.min(Math.max(analysis.score, 0), 100) * 3.6

    return (
      <div className="relative w-32 h-32">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(#2563eb ${angle}deg, #e5e7eb ${angle}deg)`,
          }}
        ></div>
        <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{analysis.score}</span>
          <span className="text-xs text-gray-500">score</span>
        </div>
      </div>
    )
  }

  const renderPredictionBadge = () => {
    if (!analysis) return null

    const map: Record<
      Prediction,
      { label: string; classes: string; icon: JSX.Element }
    > = {
      approvable: {
        label: 'Aprovável',
        classes: 'bg-green-50 text-green-800 ring-green-600/20',
        icon: <ShieldCheck className="w-4 h-4" />,
      },
      attention: {
        label: 'Potencial – Requer Ajustes',
        classes: 'bg-amber-50 text-amber-800 ring-amber-600/20',
        icon: <Sparkles className="w-4 h-4" />,
      },
      needs_improvement: {
        label: 'Requer Melhorias',
        classes: 'bg-red-50 text-red-800 ring-red-600/20',
        icon: <AlertCircle className="w-4 h-4" />,
      },
    }

    const badge = map[analysis.prediction]

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${badge.classes}`}
      >
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  const renderDetailedAnalysis = () => {
    if (!analysis) return null

    return (
      <div className="space-y-6">
        <section>
          <h3 className="font-semibold text-gray-900 mb-2">Resumo</h3>
          <p className="text-gray-600 leading-relaxed">{analysis.summary}</p>
        </section>

        {analysis.strengths.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Pontos Fortes</h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-600">
              {analysis.strengths.map((item, index) => (
                <li key={`strength-${index}`}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.weaknesses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">Pontos de Atenção</h3>
            </div>
            <ul className="space-y-1 text-sm text-gray-600">
              {analysis.weaknesses.map((item, index) => (
                <li key={`weakness-${index}`}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.compliance && Object.keys(analysis.compliance).length > 0 && (
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Checklist de Conformidade</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(analysis.compliance).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg border border-gray-200 p-3 text-sm bg-gray-50"
                >
                  <p className="text-gray-900 font-medium capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-gray-600">
                    {typeof value === 'boolean'
                      ? value
                        ? 'Em conformidade'
                        : 'Precisa de ajustes'
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  const renderSuggestions = () => {
    if (!analysis?.suggestions?.length) {
      return <p className="text-sm text-gray-500">Nenhuma sugestão disponível.</p>
    }

    const priorityColors: Record<string, string> = {
      high: 'bg-red-50 text-red-700 border-red-100',
      medium: 'bg-amber-50 text-amber-700 border-amber-100',
      low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    }

    return (
      <div className="space-y-4">
        {analysis.suggestions.map((suggestion, index) => {
          const priority = suggestion.priority?.toLowerCase() ?? 'medium'
          return (
            <div
              key={`suggestion-${index}`}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    {suggestion.section || 'Seção não informada'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {suggestion.reason || 'Sugestão da IA'}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${priorityColors[priority] || priorityColors.medium}`}
                >
                  {priority === 'high'
                    ? 'Alta prioridade'
                    : priority === 'low'
                    ? 'Baixa prioridade'
                    : 'Prioridade média'}
                </span>
              </div>
              {suggestion.original_text && (
                <p className="mt-3 text-sm text-gray-500 italic">
                  Texto atual: {suggestion.original_text}
                </p>
              )}
              {suggestion.suggested_text && (
                <div className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                  <span className="font-medium text-blue-800">Sugestão:</span>{' '}
                  {suggestion.suggested_text}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderCriticalIssues = () => {
    if (!analysis?.criticalIssues?.length) {
      return <p className="text-sm text-gray-500">Nenhum problema crítico encontrado.</p>
    }

    return (
      <div className="space-y-4">
        {analysis.criticalIssues.map((issue, index) => (
          <div
            key={`issue-${index}`}
            className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-semibold">
                {issue.section || 'Seção não informada'}
              </p>
            </div>
            <p className="text-sm text-red-900 font-medium mb-2">{issue.issue}</p>
            {issue.solution && (
              <p className="text-sm text-red-800">
                <span className="font-semibold">Solução sugerida:</span> {issue.solution}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const lastRunLabel = useMemo(() => {
    if (!analysis?.createdAt) return null
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(analysis.createdAt))
    } catch {
      return analysis.createdAt
    }
  }, [analysis?.createdAt])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">IA Insights</p>
          <h2 className="text-2xl font-bold text-gray-900">Análise Inteligente</h2>
          {lastRunLabel && (
            <p className="text-sm text-gray-500 mt-1">Última análise em {lastRunLabel}</p>
          )}
        </div>

        <button
          onClick={handleAnalyzeProject}
          disabled={isAnalyzing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Executar análise
            </>
          )}
        </button>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader className="h-6 w-6 animate-spin mb-3" />
          Carregando análise mais recente...
        </div>
      ) : !analysis ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
          <p className="font-medium text-gray-700 mb-2">Nenhuma análise disponível.</p>
          <p className="text-sm mb-4">
            Execute a primeira análise para visualizar score, recomendações e insights.
          </p>
          <button
            onClick={handleAnalyzeProject}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            <Sparkles className="h-4 w-4" />
            Iniciar análise
          </button>
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[auto,1fr] mb-6">
            <div className="flex flex-col items-center gap-3">
              {renderScoreGauge()}
              {renderPredictionBadge()}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500 mb-1">Resumo da IA</p>
              <p className="text-gray-800 leading-relaxed">{analysis.detailedAnalysis ?? analysis.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Tempo de processamento</dt>
                  <dd className="font-semibold text-gray-900">
                    {analysis.processingTime
                      ? `${analysis.processingTime}s`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tokens utilizados</dt>
                  <dd className="font-semibold text-gray-900">
                    {analysis.tokensUsed ?? '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <nav className="border-b border-gray-100 mb-6 flex gap-6 text-sm font-semibold text-gray-500">
            {(['overview', 'suggestions', 'issues'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 transition ${
                  activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-900'
                }`}
              >
                {tab === 'overview'
                  ? 'Visão Geral'
                  : tab === 'suggestions'
                  ? `Sugestões (${analysis.suggestions.length})`
                  : `Problemas (${analysis.criticalIssues.length})`}
              </button>
            ))}
          </nav>

          <div className="space-y-6">
            {activeTab === 'overview' && renderDetailedAnalysis()}
            {activeTab === 'suggestions' && renderSuggestions()}
            {activeTab === 'issues' && renderCriticalIssues()}
          </div>

          {history.length > 1 && (
            <section className="mt-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Execuções Recentes
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {history.slice(0, 4).map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 p-3 text-sm text-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">
                        Score {item.score}%
                      </span>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    <p className="text-xs mt-1">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function parseAnalysisJSON(raw: BackendAnalysis): ParsedAnalysis {
  const openaiBlock = raw.result?.openai ?? {}
  const geminiBlock = raw.result?.gemini ?? {}
  const mergedResult =
    (openaiBlock.summary && openaiBlock) ||
    (geminiBlock.summary && geminiBlock) ||
    raw.result ||
    {}

  const fallback = mergedResult === openaiBlock ? geminiBlock : openaiBlock
  const summary = mergedResult.summary ?? fallback.summary ?? 'Análise disponível.'

  const score = typeof raw.score === 'number' ? raw.score : mergedResult.score ?? 0
  let prediction: Prediction = 'needs_improvement'
  if (score >= 80) prediction = 'approvable'
  else if (score >= 60) prediction = 'attention'

  return {
    score,
    summary,
    detailedAnalysis:
      mergedResult.detailed_analysis ??
      mergedResult.summary ??
      fallback.detailed_analysis,
    strengths: mergedResult.strengths ?? fallback.strengths ?? [],
    weaknesses: mergedResult.weaknesses ?? fallback.weaknesses ?? [],
    prediction,
    suggestions:
      raw.suggestions ?? mergedResult.suggestions ?? fallback.suggestions ?? [],
    criticalIssues:
      raw.critical_issues ??
      mergedResult.critical_issues ??
      fallback.critical_issues ??
      [],
    compliance: mergedResult.compliance ?? fallback.compliance,
    tokensUsed: raw.tokens_used,
    processingTime: raw.processing_time,
    createdAt: raw.created_at,
    raw,
  }
}
